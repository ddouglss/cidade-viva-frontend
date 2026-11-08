import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CityStore } from '../../core/city-store';
import { DevicePanel, Metric } from '../../shared/device-panel';
import { PageHeading } from '../../shared/page-heading';
import { CommandList } from '../../shared/command-list';
import { numberMetric, reportedBoolean } from '../../core/presentation';

@Component({ imports: [FormsModule, DevicePanel, Metric, PageHeading, CommandList], template: `
  <cv-page-heading eyebrow="03 / HIDRÁULICA" title="Água sob controle" subtitle="Reservatório, umidade e acionamento da bomba com proteção local." />
  <div class="content-columns"><div>@if (store.water(); as device) { <cv-device-panel [device]="device"><div class="metric-grid"><cv-metric label="Umidade da amostra" [value]="metric(device, 'soilHumidityPct')" unit="%" /><cv-metric label="Acionamento da bomba" [value]="state(device, 'pumpOn')" caption="Comando de saída · não comprova vazão" /></div>
    @if (metric(device, 'soilAdcRaw') !== null) { <p class="notice">ADC bruto: {{ metric(device, 'soilAdcRaw') }}. Sem percentual de umidade calibrado.</p> }
    <div class="reservoir-status" [class.low]="device.measurements['reservoirLow'] !== false"><span class="reservoir-icon" aria-hidden="true">≈</span><div><strong>{{ device.measurements['reservoirLow'] === true ? 'Reservatório com nível baixo' : device.measurements['reservoirLow'] === false ? 'Nível reportado normal' : 'Nível não informado' }}</strong><p>{{ device.measurements['reservoirLow'] !== false ? 'O pulso de irrigação está bloqueado.' : 'A proteção final continua no controlador.' }}</p></div></div>
    <div class="control-section"><div class="row-between"><h3>Modo de irrigação</h3><span class="mode-label">{{ device.mode ?? 'Não informado' }}</span></div><div class="button-group"><button class="button secondary" [disabled]="!!store.blocked(device, 'SET_IRRIGATION_MODE') || device.mode === 'AUTO'" (click)="store.send(device, 'SET_IRRIGATION_MODE', {mode: 'AUTO'})">Automático</button><button class="button secondary" [disabled]="!!store.blocked(device, 'SET_IRRIGATION_MODE') || device.mode === 'MANUAL'" (click)="store.send(device, 'SET_IRRIGATION_MODE', {mode: 'MANUAL'})">Manual</button></div>
      <h3>Pulso manual</h3><div class="pulse-control"><div class="field"><label for="pulse-duration">Duração em milissegundos</label><input id="pulse-duration" type="number" min="1" [max]="maxPulse()" [ngModel]="duration()" (ngModelChange)="duration.set($event)" [disabled]="!store.auth.operator()" aria-describedby="pulse-help"></div><button class="button primary" [disabled]="!!store.blocked(device, 'PUMP_PULSE') || !validDuration()" (click)="store.send(device, 'PUMP_PULSE', {durationMs: duration()})">Solicitar pulso <span aria-hidden="true">→</span></button></div><p id="pulse-help" class="control-help">{{ store.blocked(device, 'PUMP_PULSE') || (!validDuration() ? 'Informe uma duração inteira entre 1 e ' + maxPulse() + ' ms.' : 'Limite da API: ' + maxPulse() + ' ms. O controlador também valida boia, timeout e cooldown.') }}</p>
    </div></cv-device-panel> } @else if (!store.loading()) { <div class="panel empty-state"><p>Sem dados do dispositivo hidráulico.</p></div> }
    <section class="panel section-gap"><div class="panel-heading"><h2>Solicitações de irrigação</h2></div><cv-command-list deviceKey="esp32-water" /></section></div>
    <aside><section class="panel info-panel"><span class="eyebrow">COMO LER ESTES DADOS</span><h2>Umidade e circulação são diferentes</h2><p>A horta visual é artificial. A leitura de umidade vem de uma amostra instrumentada ou de uma entrada simulada, sempre identificada.</p><p>O acionamento reportado da bomba não comprova que a água está circulando.</p></section><section class="panel info-panel section-gap"><span class="eyebrow">LIMITES DE LABORATÓRIO</span><h2>Proteções preservadas</h2><ul class="plain-list"><li>Boia baixa ou indeterminada bloqueia a bomba.</li><li>Modo manual não anula o tempo máximo.</li><li>Sem ACK, o resultado permanece não confirmado.</li></ul>@if (store.water()?.automationRules?.length) { <p class="notice">Limites versionados na API. Configuração ainda não enviada à placa (NOT_SENT).</p> }</section></aside>
  </div>` })
export class Water {
  readonly store = inject(CityStore); readonly metric = numberMetric; readonly state = reportedBoolean;
  readonly duration = signal<number>(1000);
  readonly maxPulse = computed(() => Math.min(3000, this.store.water()?.automationRules?.[0]?.maxPulseMs ?? 3000));
  readonly validDuration = computed(() => Number.isInteger(this.duration()) && this.duration() >= 1 && this.duration() <= this.maxPulse());
}
