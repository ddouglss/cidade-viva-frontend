import { inject, Injectable, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_BASE } from './api';
import { Command } from './models';

export type LiveStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';
@Injectable({ providedIn: 'root' })
export class CityLive {
  private readonly base = inject(API_BASE);
  readonly status = signal<LiveStatus>('offline');
  private hub?: HubConnection;
  private retry?: ReturnType<typeof setTimeout>;
  private generation = 0;
  async start(token: () => string, refresh: () => void, command: (value: Command) => void) {
    const generation = ++this.generation;
    await this.disconnect();
    if (generation !== this.generation) return;
    const hub = new HubConnectionBuilder().withUrl(this.base + '/hubs/city', { accessTokenFactory: token })
      .withAutomaticReconnect([0, 2000, 5000, 10000]).configureLogging(LogLevel.None).build();
    this.hub = hub;
    for (const event of ['DeviceTelemetryUpdated', 'DeviceStatusChanged', 'AlertRaised']) hub.on(event, refresh);
    hub.on('CommandStatusChanged', (value: Command) => { command(value); refresh(); });
    hub.onreconnecting(() => { if (this.hub === hub) this.status.set('reconnecting'); });
    hub.onreconnected(() => { if (this.hub === hub) { this.status.set('connected'); refresh(); } });
    const connect = async () => {
      if (this.hub !== hub) return;
      this.status.set('connecting');
      try { await hub.start(); if (this.hub === hub) { this.status.set('connected'); refresh(); } }
      catch { if (this.hub === hub) { this.status.set('offline'); this.retry = setTimeout(connect, 5000); } }
    };
    hub.onclose(() => { if (this.hub === hub) { this.status.set('offline'); this.retry = setTimeout(connect, 5000); } });
    await connect();
  }
  async stop() {
    ++this.generation;
    await this.disconnect();
  }
  private async disconnect() {
    clearTimeout(this.retry);
    const previous = this.hub; this.hub = undefined; this.status.set('offline');
    if (previous) await previous.stop().catch(() => undefined);
  }
}
