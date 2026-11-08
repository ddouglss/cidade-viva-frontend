import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CityStore } from '../../core/city-store';
import { friendlyError } from '../../core/api';
import { PageHeading } from '../../shared/page-heading';
import { CommandList } from '../../shared/command-list';
import { Page, Reading } from '../../core/models';
import { originLabel, qualityLabel } from '../../core/presentation';

@Component({ imports: [PageHeading, CommandList, FormsModule, DatePipe], templateUrl: './history.html' })
export class History {
  readonly store = inject(CityStore); readonly result = signal<Page<Reading> | null>(null);
  readonly loading = signal(false); readonly error = signal(''); readonly lookupError = signal('');
  readonly origin = originLabel; readonly quality = qualityLabel;
  deviceKey = 'esp32-water'; metric = ''; from = ''; to = ''; commandId = '';
  readonly lookupBusy = signal(false);
  private request = 0;
  constructor() { void this.load(); }
  async load(page = 1) {
    const request = ++this.request;
    this.error.set(''); this.loading.set(true);
    try {
      const from = this.from ? new Date(this.from).toISOString() : undefined;
      const to = this.to ? new Date(this.to).toISOString() : undefined;
      if (from && to && from >= to) { this.error.set('O início deve ser anterior ao fim do período.'); return; }
      const result = await this.store.api.readings(this.deviceKey, { page, metric: this.metric.trim() || undefined, from, to });
      if (request === this.request) this.result.set(result);
    } catch (error) { if (request === this.request) this.error.set(friendlyError(error)); }
    finally { if (request === this.request) this.loading.set(false); }
  }
  async lookup() {
    this.lookupError.set('');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.commandId.trim())) { this.lookupError.set('Informe um ID de comando UUID válido.'); return; }
    if (this.lookupBusy()) return;
    const sessionToken = this.store.auth.accessToken();
    this.lookupBusy.set(true);
    try { const command = await this.store.api.command(this.commandId.trim()); if (sessionToken === this.store.auth.accessToken()) { this.store.mergeCommand(command); this.commandId = ''; } }
    catch (error) { this.lookupError.set(friendlyError(error)); }
    finally { this.lookupBusy.set(false); }
  }
  format(reading: Reading) { return typeof reading.value === 'boolean' ? reading.value ? 'Sim' : 'Não' : reading.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }
}
