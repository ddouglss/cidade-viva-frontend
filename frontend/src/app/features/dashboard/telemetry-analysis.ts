import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CityApi, friendlyError } from '../../core/api';
import { DataOrigin, Reading } from '../../core/models';
import { originLabel } from '../../core/presentation';

@Component({
  selector: 'cv-telemetry-analysis',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <section class="panel dashboard-module">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">TELEMETRIA &amp; SÉRIES TEMPORAIS</span>
          <h2>Análise de leituras e tendências</h2>
        </div>
        <div class="button-group">
          <button type="button" class="button secondary" (click)="exportCsv()" [disabled]="!series()">Exportar CSV</button>
          <button type="button" class="button secondary" (click)="refresh.update(n => n + 1)" [disabled]="loading()">Atualizar amostra</button>
        </div>
      </div>
      <div class="module-body">
        <div class="analysis-filters">
          <label>Métrica instrumentada
            <select #metric (change)="metricIndex.set(+metric.value)">
              @for (item of metrics; track item.metric; let index = $index) {
                <option [value]="index">{{ item.label }} ({{ item.unit }})</option>
              }
            </select>
          </label>
          <label>Janela temporal
            <select #period (change)="hours.set(+period.value)">
              <option value="1">Última 1 hora</option>
              <option value="6">Últimas 6 horas</option>
              <option value="24" selected>Últimas 24 horas</option>
              <option value="168">Últimos 7 dias</option>
            </select>
          </label>
          <label>Filtro de origem
            <select #source (change)="origin.set($any(source.value))">
              <option value="ALL">Todas as origens válidas</option>
              <option value="SIMULATED_INPUT">Simulação (SIMULATED_INPUT)</option>
              <option value="PHYSICAL_SENSOR">Sensor físico (PHYSICAL_SENSOR)</option>
              <option value="CALCULATED">Calculado (CALCULATED)</option>
            </select>
          </label>
        </div>

        @if (loading()) {
          <p class="notice" role="status">Consultando série temporal da API…</p>
        } @else if (error()) {
          <p class="notice error" role="alert">{{ error() }}</p>
        } @else if (series(); as data) {
          <dl class="analysis-summary four-cols">
            <div><dt>Mínimo</dt><dd>{{ data.min | number:'1.0-2' }} {{ current().unit }}</dd></div>
            <div><dt>Média aritmética</dt><dd>{{ data.mean | number:'1.0-2' }} {{ current().unit }}</dd></div>
            <div><dt>Máximo</dt><dd>{{ data.max | number:'1.0-2' }} {{ current().unit }}</dd></div>
            <div><dt>Última leitura</dt><dd>{{ data.latest | number:'1.0-2' }} {{ current().unit }}</dd></div>
          </dl>

          <svg class="analysis-plot" viewBox="0 0 500 156" role="img" aria-label="Gráfico de série temporal das leituras válidas por horário de recepção.">
            <defs>
              <linearGradient id="telemetryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#287454" stop-opacity="0.26"/>
                <stop offset="100%" stop-color="#287454" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <!-- Grade de referência -->
            <path d="M 16 16 V 136 H 484 M 16 76 H 484" fill="none" stroke="#d5e0d7" stroke-width="1"/>
            <!-- Linha da média -->
            <line x1="16" [attr.y1]="data.meanY" x2="484" [attr.y2]="data.meanY" stroke="#996e21" stroke-width="1.2" stroke-dasharray="4 4"/>
            @if (data.areaPath) {
              <path [attr.d]="data.areaPath" fill="url(#telemetryAreaGrad)"/>
            }
            @if (data.linePath) {
              <path [attr.d]="data.linePath" fill="none" stroke="#287454" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
            }
            @for (point of data.points; track point.id) {
              <circle [attr.cx]="point.x" [attr.cy]="point.y" r="3.4"
                      [attr.fill]="point.origin === 'SIMULATED_INPUT' ? '#b38728' : '#183d32'"
                      stroke="#ffffff" stroke-width="1">
                <title>{{ point.receivedAt | date:'dd/MM HH:mm:ss' }}: {{ point.value }} {{ current().unit }} ({{ sourceLabel(point.origin) }})</title>
              </circle>
            }
          </svg>

          <div class="row-between small muted-text">
            <span>Início: <time>{{ data.start | date:'dd/MM HH:mm:ss' }}</time></span>
            <span>Linha tracejada âmbar: média ({{ data.mean | number:'1.0-2' }} {{ current().unit }})</span>
            <span>Fim: <time>{{ data.end | date:'dd/MM HH:mm:ss' }}</time></span>
          </div>

          <div class="methodology-note">
            <span><strong>Proveniência:</strong> {{ data.points.length }} amostras com qualidade <code>VALID</code> · Controlador <code>{{ current().key }}</code> · Origem: {{ originFilterLabel() }}.</span>
            <span>Método: Amostragem direta sem interpolação artificial de lacunas.</span>
          </div>

          <details>
            <summary>Inspecionar tabela da amostra ({{ data.points.length }} registros)</summary>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Recebido em</th>
                    <th>Origem</th>
                    <th>Qualidade</th>
                    <th>{{ current().label }} ({{ current().unit }})</th>
                  </tr>
                </thead>
                <tbody>
                  @for (point of data.points; track point.id) {
                    <tr>
                      <td>{{ point.receivedAt | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                      <td><span class="badge" [class.sim]="point.origin === 'SIMULATED_INPUT'">{{ sourceLabel(point.origin) }}</span></td>
                      <td>{{ point.quality }}</td>
                      <td class="numeric">{{ point.value | number:'1.0-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </details>
        } @else {
          <div class="empty-state compact">
            <span aria-hidden="true">↗</span>
            <p>Nenhuma leitura numérica válida para o filtro selecionado.</p>
            <span>Ajuste a janela temporal ou selecione "Todas as origens válidas".</span>
          </div>
        }
      </div>
    </section>
  `
})
export class TelemetryAnalysis {
  private readonly api = inject(CityApi);
  readonly metrics = [
    { key: 'esp32-energy', metric: 'illuminanceLux', label: 'Luminosidade Ambiente', unit: 'lx' },
    { key: 'esp32-water', metric: 'soilHumidityPct', label: 'Umidade da Amostra', unit: '%' },
    { key: 'esp32-water', metric: 'soilAdcRaw', label: 'ADC Bruto do Solo', unit: 'raw' }
  ];
  readonly metricIndex = signal(0);
  readonly current = computed(() => this.metrics[this.metricIndex()]);
  readonly hours = signal(24);
  readonly origin = signal<DataOrigin | 'ALL'>('ALL');
  readonly refresh = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly sourceLabel = originLabel;
  private readonly readings = signal<Reading[]>([]);

  readonly originFilterLabel = computed(() => {
    const o = this.origin();
    return o === 'ALL' ? 'Todas (Sensor físico + Simulação)' : originLabel(o);
  });

  readonly series = computed(() => {
    const selectedOrigin = this.origin();
    const readings = this.readings().flatMap(reading => {
      const time = Date.parse(reading.receivedAt);
      const matchesOrigin = selectedOrigin === 'ALL' || reading.origin === selectedOrigin;
      return matchesOrigin && reading.quality === 'VALID'
        && typeof reading.value === 'number' && Number.isFinite(reading.value) && Number.isFinite(time)
        ? [{ id: reading.id, value: reading.value, time, receivedAt: reading.receivedAt, origin: reading.origin, quality: reading.quality }] : [];
    }).sort((a, b) => a.time - b.time);

    if (!readings.length) return null;
    const values = readings.map(r => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const latest = readings[readings.length - 1].value;
    const start = readings[0].time;
    const end = readings[readings.length - 1].time;

    const toY = (val: number) => min === max ? 76 : 132 - ((val - min) / (max - min)) * 112;
    const points = readings.map(reading => ({
      ...reading,
      x: start === end ? 250 : 16 + ((reading.time - start) / (end - start)) * 468,
      y: toY(reading.value)
    }));

    const linePath = points.length > 1
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
      : '';
    const areaPath = points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} 136 L ${points[0].x.toFixed(1)} 136 Z`
      : '';

    return {
      min,
      max,
      mean,
      latest,
      start,
      end,
      meanY: toY(mean),
      linePath,
      areaPath,
      points
    };
  });

  constructor() {
    effect(onCleanup => {
      const { key, metric } = this.current();
      const hours = this.hours();
      this.refresh();
      let active = true;
      onCleanup(() => { active = false; });
      this.loading.set(true);
      this.error.set('');
      this.readings.set([]);
      const now = Date.now();
      void this.api.readings(key, {
        page: 1,
        pageSize: 200,
        metric,
        from: new Date(now - hours * 3_600_000).toISOString(),
        to: new Date(now).toISOString()
      }).then(page => {
        if (active) this.readings.set(page.items);
      }).catch(error => {
        if (active) this.error.set(friendlyError(error));
      }).finally(() => {
        if (active) this.loading.set(false);
      });
    });
  }

  exportCsv() {
    const data = this.series();
    if (!data) return;
    const header = 'id,deviceKey,metric,unit,origin,quality,receivedAt,value\n';
    const rows = data.points.map(p =>
      `${p.id},${this.current().key},${this.current().metric},${this.current().unit},${p.origin},${p.quality},${p.receivedAt},${p.value}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cidade-viva-${this.current().metric}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
