import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth';
import { CityApi, friendlyError } from './api';
import { CityLive } from './live';
import { CityAlert, Command, Device, terminalCommand } from './models';
import { commandBlockReason } from './presentation';

@Injectable({ providedIn: 'root' })
export class CityStore {
  readonly api = inject(CityApi);
  readonly auth = inject(AuthService);
  readonly live = inject(CityLive);
  readonly devices = signal<Device[]>([]);
  readonly alerts = signal<CityAlert[]>([]);
  readonly commands = signal<Command[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly updatedAt = signal<Date | null>(null);
  readonly activeAlerts = computed(() => this.alerts().filter(a => a.active));
  readonly energy = computed(() => this.devices().find(d => d.deviceKey === 'esp32-energy'));
  readonly water = computed(() => this.devices().find(d => d.deviceKey === 'esp32-water'));
  readonly simulated = computed(() => this.devices().some(d => d.origin === 'SIMULATED_INPUT'));
  private session = 0;
  private queued?: ReturnType<typeof setTimeout>;
  private inFlight?: Promise<void>;
  private refreshAgain = false;
  private polling = false;

  constructor() {
    effect(onCleanup => {
      const user = this.auth.user();
      const generation = ++this.session;
      this.devices.set([]); this.alerts.set([]); this.commands.set([]); this.updatedAt.set(null); this.error.set(''); this.actionError.set('');
      this.loading.set(!!user); this.inFlight = undefined; this.refreshing.set(false);
      this.refreshAgain = false;
      if (!user) { void this.live.stop(); return; }
      void this.refresh();
      void this.live.start(() => this.auth.accessToken() ?? '', () => this.scheduleRefresh(generation), c => {
        if (generation === this.session && this.commands().some(existing => existing.commandId === c.commandId)) this.mergeCommand(c);
      });
      const interval = setInterval(() => { void this.refresh(); void this.pollCommands(); }, 5000);
      onCleanup(() => { clearInterval(interval); clearTimeout(this.queued); void this.live.stop(); });
    });
  }
  scheduleRefresh(generation = this.session) {
    clearTimeout(this.queued);
    this.queued = setTimeout(() => {
      if (generation !== this.session) return;
      if (this.inFlight) this.refreshAgain = true;
      else void this.refresh();
      void this.pollCommands();
    }, 120);
  }
  refresh(): Promise<void> {
    if (!this.auth.user()) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    const generation = this.session;
    this.refreshing.set(true);
    this.inFlight = Promise.all([this.api.devices(), this.api.alerts()]).then(([devices, alerts]) => {
      if (generation !== this.session) return;
      this.devices.set(devices); this.alerts.set(alerts); this.updatedAt.set(new Date()); this.error.set('');
    }).catch(error => { if (generation === this.session) { this.error.set(friendlyError(error)); this.devices.update(devices => devices.map(d => ({...d,online:false,isStale:true}))); } })
      .finally(() => {
        if (generation !== this.session) return;
        this.loading.set(false);
        this.refreshing.set(false);
        this.inFlight = undefined;
        if (this.refreshAgain) {
          this.refreshAgain = false;
          void this.refresh();
        }
      });
    return this.inFlight;
  }
  pending(key: string) { return this.commands().some(c => c.deviceKey === key && !terminalCommand(c.status)); }
  blocked(device: Device | undefined, action: string) {
    if (this.error()) return 'A plataforma não está acessível. Atualize os dados antes de enviar comandos.';
    return commandBlockReason(device, this.auth.operator(), !!device && this.pending(device.deviceKey), action);
  }
  async send(device: Device | undefined, action: string, parameters: Record<string, unknown>) {
    const block = this.blocked(device, action);
    if (block || !device) { this.actionError.set(block); return; }
    const generation = this.session;
    const id = crypto.randomUUID();
    const command: Command = { commandId: id, deviceKey: device.deviceKey, action, parameters, status: 'REQUESTED', reason: null,
      requestedAt: new Date().toISOString(), expiresAt: '', publishedAt: null, requestedBy: this.auth.user()!.id, observedState: null };
    this.mergeCommand(command); this.actionError.set('');
    try {
      const result = await this.api.requestCommand(device.deviceKey, id, action, parameters);
      if (generation === this.session) { this.mergeCommand(result); void this.checkCommand(id); }
    } catch (error) {
      if (generation !== this.session) return;
      const rejected = error instanceof HttpErrorResponse && [400, 401, 403, 404, 409, 429].includes(error.status);
      this.mergeCommand({ ...command, status: rejected ? 'FAILED' : 'UNCONFIRMED', reason: rejected ? null : 'NETWORK_ERROR' });
      this.actionError.set(friendlyError(error));
    }
  }
  mergeCommand(command: Command) {
    const current = this.commands().find(c => c.commandId === command.commandId);
    if (current && terminalCommand(current.status) && !terminalCommand(command.status)) return;
    const phases = ['REQUESTED', 'PENDING', 'PUBLISHED', 'RECEIVED'];
    if (current && phases.includes(current.status) && phases.includes(command.status) && phases.indexOf(command.status) < phases.indexOf(current.status)) return;
    // Show only commands requested/queried in this UI session; another operator's events do not silently expand the list.
    this.commands.update(items => {
      const updated = [command, ...items.filter(c => c.commandId !== command.commandId)];
      let completed = 0;
      return updated.filter(c => !terminalCommand(c.status) || ++completed <= 50);
    });
  }
  async checkCommand(id: string) {
    const generation = this.session;
    try { const result = await this.api.command(id); if (generation === this.session) { this.mergeCommand(result); this.actionError.set(''); } }
    catch (error) {
      if (generation !== this.session) return;
      const current = this.commands().find(c => c.commandId === id);
      if (current?.status === 'UNCONFIRMED' && error instanceof HttpErrorResponse && error.status === 404) {
        this.mergeCommand({ ...current, reason: 'COMMAND_LOOKUP_NOT_FOUND' });
        this.actionError.set('');
        return;
      }
      this.actionError.set(friendlyError(error));
    }
  }
  private async pollCommands() {
    if (this.polling || !this.auth.user()) return;
    this.polling = true;
    try {
      const active = this.commands().filter(c => c.status !== 'REQUESTED' && !terminalCommand(c.status)
        && !(c.status === 'UNCONFIRMED' && c.reason === 'COMMAND_LOOKUP_NOT_FOUND'));
      await Promise.all(active.map(c => this.checkCommand(c.commandId)));
    }
    finally { this.polling = false; }
  }
  async acknowledge(alert: CityAlert) {
    if (!this.auth.operator() || alert.acknowledgedAt) return;
    const generation = this.session;
    try {
      const updated = await this.api.acknowledge(alert.id);
      if (generation === this.session) this.alerts.update(items => items.map(a => a.id === updated.id ? updated : a));
    } catch (error) { if (generation === this.session) this.actionError.set(friendlyError(error)); }
  }
}
