import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../../core/city-store';
import { numberMetric, originLabel, qualityLabel, reportedBoolean } from '../../core/presentation';
import { PageHeading } from '../../shared/page-heading';
import { TelemetryAnalysis } from '../dashboard/telemetry-analysis';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [RouterLink, PageHeading, TelemetryAnalysis],
  template: `
    <cv-page-heading
      eyebrow="08 / ANÁLISES, RELATÓRIOS E SUSTENTABILIDADE (SEÇÃO 14)"
      title="Análise de dados e transparência metodológica"
      subtitle="Séries temporais com origem verificada, distinção estrita entre medido, simulado e não instrumentado, e alinhamento educacional ODS." />

    <!-- Gráfico Principal Interativo + Exportação CSV -->
    <cv-telemetry-analysis />

    <!-- Matriz de Transparência de Instrumentação (Inefável no SDD v1.2 Seções 4.2, 6, 7 e 14) -->
    <section class="panel section-gap">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">METODOLOGIA E LIMITES HONESTOS</span>
          <h2>Matriz de instrumentação e proveniência das grandezas</h2>
        </div>
        <a routerLink="/melhorias" class="text-link">Propor nova instrumentação ↗</a>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Grandeza / Indicador</th>
              <th>Controlador / Fonte</th>
              <th>Status de Instrumentação</th>
              <th>Valor Atual</th>
              <th>Nota Metodológica (SDD v1.2)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Iluminância Ambiente (lx)</strong></td>
              <td><code>esp32-energy</code> (BH1750)</td>
              <td><span class="badge good">{{ origin(store.energy()?.origin ?? null) }}</span></td>
              <td class="numeric">{{ metric(store.energy(), 'illuminanceLux') ?? '—' }} lx</td>
              <td>Medida ou simulada conforme envelope MQTT. Aciona limiar crepuscular em modo AUTO.</td>
            </tr>
            <tr>
              <td><strong>Estado do Ramal Principal 5V</strong></td>
              <td><code>esp32-energy</code> (2 postes)</td>
              <td><span class="badge good">Estado Lógico Reportado</span></td>
              <td><strong>{{ state(store.energy(), 'mainLightOn') }}</strong></td>
              <td>Reflete confirmação de saída do controlador; não substitui sensor fotométrico individual.</td>
            </tr>
            <tr>
              <td><strong>Potência / Consumo Elétrico (V, mA, Wh)</strong></td>
              <td>Ramal Principal / Solar</td>
              <td>
                @if (metric(store.energy(), 'busVoltageV') !== null) {
                  <span class="badge good">Instrumentado</span>
                } @else {
                  <span class="badge muted">Não instrumentado</span>
                }
              </td>
              <td>{{ metric(store.energy(), 'busVoltageV') !== null ? (metric(store.energy(), 'busVoltageV') + ' V') : 'Não instrumentado' }}</td>
              <td>Sem sensor INA219 ativo no circuito, a plataforma não fabrica números de Wh ou economia percentual.</td>
            </tr>
            <tr>
              <td><strong>Geração dos 4 Postes Solares</strong></td>
              <td>Circuito PV Independente</td>
              <td><span class="badge sim">Circuito Autônomo</span></td>
              <td>Não instrumentado</td>
              <td>Circuito físico próprio (PV → controlador → bateria → LED) isolado do barramento MQTT.</td>
            </tr>
            <tr>
              <td><strong>Umidade da Amostra &amp; ADC Solo</strong></td>
              <td><code>esp32-water</code></td>
              <td><span class="badge" [class.sim]="store.water()?.origin === 'SIMULATED_INPUT'">{{ origin(store.water()?.origin ?? null) }}</span></td>
              <td class="numeric">{{ metric(store.water(), 'soilHumidityPct') ?? '—' }}% (ADC: {{ metric(store.water(), 'soilAdcRaw') ?? '—' }})</td>
              <td>Diferencia amostra física calibrada de entrada simulada.</td>
            </tr>
            <tr>
              <td><strong>Vazão / Volume de Água Consumido</strong></td>
              <td><code>esp32-water</code> (Bomba 5V)</td>
              <td><span class="badge muted">Sem sensor de vazão</span></td>
              <td>Bomba: {{ state(store.water(), 'pumpOn') }}</td>
              <td>O estado <code>pumpOn</code> confirma apenas acionamento elétrico; volume em mL/L não é inferido sem hidrômetro.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Alinhamento Educacional ODS (Seção 14 do Doc 00) -->
    <div class="device-grid section-gap">
      <section class="panel info-panel">
        <span class="eyebrow">ALINHAMENTO EDUCACIONAL (ONU ODS)</span>
        <h2>Sustentabilidade em escala didática</h2>
        <ul class="plain-list">
          <li><strong>ODS 7 (Energia Limpa e Acessível):</strong> Demonstração de iluminação pública automatizada por luminosidade (BH1750) combinada a 4 postes solares autônomos.</li>
          <li><strong>ODS 9 (Indústria, Inovação e Infraestrutura):</strong> Arquitetura IoT resiliente com telemetria tipada, MQTT, ACK explícito e intertravamentos locais nos ESP32.</li>
          <li><strong>ODS 11 (Cidades e Comunidades Sustentáveis):</strong> Travessia acessível com sinalização sonora (buzzer) e centro integrado de incidentes.</li>
          <li><strong>ODS 13 (Ação contra a Mudança Global do Clima):</strong> Uso racional de água na horta demonstrativa com bloqueio automático por nível de reservatório.</li>
        </ul>
      </section>
      <section class="panel info-panel">
        <span class="eyebrow">INTEGRIDADE CIENTÍFICA</span>
        <h2>Por que não exibimos percentuais fictícios?</h2>
        <p>Conforme os princípios inegociáveis do SDD v1.2, o Centro de Operações Cidade Viva distingue rigorosamente <code>PHYSICAL_SENSOR</code>, <code>SIMULATED_INPUT</code>, <code>CALCULATED</code> e <code>Não instrumentado</code>.</p>
        <p>Qualquer comparativo "antes vs. depois" é vinculado a uma proposta formal no módulo de <strong>Gestão de Melhorias</strong> com janela temporal e amostragem explícitas.</p>
        <a routerLink="/melhorias" class="button secondary">Abrir Gestão de Melhorias →</a>
      </section>
    </div>
  `
})
export class Analytics {
  readonly store = inject(CityStore);
  readonly metric = numberMetric;
  readonly state = reportedBoolean;
  readonly origin = originLabel;
  readonly quality = qualityLabel;
}
