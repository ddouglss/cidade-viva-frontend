import { Component, inject } from '@angular/core';
import { CityStore } from '../../core/city-store';
import { DevicePanel, Metric } from '../../shared/device-panel';
import { PageHeading } from '../../shared/page-heading';
import { CommandList } from '../../shared/command-list';
import { numberMetric, reportedBoolean } from '../../core/presentation';

@Component({ imports: [DevicePanel, Metric, PageHeading, CommandList], template: `
  <cv-page-heading eyebrow="02 / ENERGIA" title="Luz para a cidade" subtitle="Iluminação principal e circuito solar independente." />
  <div class="content-columns">
    <div>@if (store.energy(); as device) { <cv-device-panel [device]="device"><div class="metric-grid"><cv-metric label="Luminosidade ambiente" [value]="metric(device, 'illuminanceLux')" unit="lx" /><cv-metric label="Iluminação principal" [value]="state(device, 'mainLightOn')" caption="Dois postes · último estado recebido" /></div>
      <div class="control-section"><h3>Modo de iluminação</h3><div class="row-between"><span class="mode-label">{{ device.mode ?? 'Não informado' }}</span><div class="button-group"><button class="button secondary" [disabled]="!!store.blocked(device, 'SET_LIGHT_MODE') || device.mode === 'AUTO'" (click)="store.send(device, 'SET_LIGHT_MODE', {mode: 'AUTO'})">Automático</button><button class="button secondary" [disabled]="!!store.blocked(device, 'SET_LIGHT_MODE') || device.mode === 'MANUAL'" (click)="store.send(device, 'SET_LIGHT_MODE', {mode: 'MANUAL'})">Manual</button></div></div>
      <h3>Comando manual</h3><div class="button-group"><button class="button primary" [disabled]="!!store.blocked(device, 'SET_LIGHT_MAIN')" (click)="store.send(device, 'SET_LIGHT_MAIN', {on: true})">Solicitar ligar</button><button class="button secondary" [disabled]="!!store.blocked(device, 'SET_LIGHT_MAIN')" (click)="store.send(device, 'SET_LIGHT_MAIN', {on: false})">Solicitar desligar</button></div><p class="control-help">{{ store.blocked(device, 'SET_LIGHT_MAIN') || 'Aguarde o ACK. A solicitação não altera o estado reportado antecipadamente.' }}</p></div>
      @if (metric(device, 'busVoltageV') !== null || metric(device, 'currentMa') !== null) { <div class="metric-grid"><cv-metric label="Tensão do ramo instrumentado" [value]="metric(device, 'busVoltageV')" unit="V" /><cv-metric label="Corrente do ramo instrumentado" [value]="metric(device, 'currentMa')" unit="mA" /></div> }
    </cv-device-panel> } @else if (!store.loading()) { <div class="panel empty-state"><p>Sem dados do dispositivo de energia.</p></div> }
    <section class="panel section-gap"><div class="panel-heading"><h2>Solicitações de iluminação</h2></div><cv-command-list deviceKey="esp32-energy" /></section></div>
    <aside class="panel solar-panel"><span class="solar-symbol" aria-hidden="true">☼</span><span class="eyebrow">ENERGIA SOLAR</span><h2>Um circuito independente</h2><p>Quatro postes previstos no circuito solar, separados da fonte principal.</p><div class="solar-posts" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="notice">Geração, carga e autonomia não estão sendo medidas nesta interface.</div><p class="small muted-text">Comandar os postes principais não altera o circuito solar.</p></aside>
  </div>` })
export class Energy {
  readonly store = inject(CityStore); readonly metric = numberMetric; readonly state = reportedBoolean;
}
