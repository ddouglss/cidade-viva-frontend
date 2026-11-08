import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Device } from '../core/models';
import { deviceName, originLabel, qualityLabel } from '../core/presentation';

@Component({ selector: 'cv-device-status', template: `
  <span class="badge" [class.good]="device().online && !device().isStale" [class.muted]="!device().online || device().isStale">
    <span class="status-dot" aria-hidden="true"></span>{{ device().isStale ? 'Desatualizado' : device().online ? 'Online' : 'Offline' }}
  </span>` })
export class DeviceStatus { readonly device = input.required<Device>(); }

@Component({ selector: 'cv-device-panel', imports: [DeviceStatus, DatePipe], template: `
  <article class="panel device-panel">
    <div class="panel-heading"><div><span class="eyebrow">{{ device().deviceKey }}</span><h2>{{ name(device().deviceKey) }}</h2></div><cv-device-status [device]="device()" /></div>
    <div class="source-line"><span class="badge" [class.sim]="device().origin === 'SIMULATED_INPUT'">{{ origin(device().origin) }}</span><span class="small muted-text">Qualidade: {{ quality(device().quality) }}</span></div>
    <ng-content />
    <footer class="device-footer"><span>Última telemetria</span><time [attr.datetime]="device().lastTelemetryAt" [title]="device().lastTelemetryAt ?? 'Ainda não recebida'">{{ device().lastTelemetryAt ? (device().lastTelemetryAt | date:'dd/MM, HH:mm:ss') : 'Ainda não recebida' }}</time></footer>
  </article>` })
export class DevicePanel {
  readonly device = input.required<Device>();
  readonly name = deviceName; readonly origin = originLabel; readonly quality = qualityLabel;
}

@Component({ selector: 'cv-metric', template: `
  <div class="metric"><span class="metric-label">{{ label() }}</span><div class="metric-value">{{ format(value()) }}<span class="metric-unit">{{ value() === null || value() === undefined ? '' : unit() }}</span></div><span class="metric-caption">{{ value() === null || value() === undefined ? 'Sem leitura disponível' : caption() }}</span></div>` })
export class Metric {
  readonly label = input.required<string>(); readonly value = input<number | string | null | undefined>(null);
  readonly unit = input(''); readonly caption = input('Último valor reportado');
  format(value: number | string | null | undefined) { return value === null || value === undefined ? '—' : typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : value; }
}
