import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CityApi, friendlyError } from '../../core/api';
import { CityStore } from '../../core/city-store';
import { AutomationRule } from '../../core/models';
import { deviceName } from '../../core/presentation';
import { PageHeading } from '../../shared/page-heading';

@Component({
  selector: 'app-automations',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeading],
  template: `
    <cv-page-heading
      eyebrow="11 / AUTOMAÇÕES E REGRAS LOCAIS (SEÇÃO 11 · FE-112)"
      title="Parâmetros de automação e limites de segurança"
      subtitle="Diferencia estado desejado na API, estado reportado pelo controlador e limites físicos absolutos do firmware." />

    <div class="content-columns">
      <div>
        <!-- Regras Versionadas na API (PUT /api/v1/automation-rules/{id}) -->
        <section class="panel">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">REGRAS PARAMETRIZÁVEIS NA API</span>
              <h2>Regras de automação cadastradas ({{ allRules().length }})</h2>
            </div>
            <span class="badge muted">{{ store.auth.operator() ? 'Edição habilitada (Operador)' : 'Somente leitura (Viewer)' }}</span>
          </div>

          <div class="module-body">
            @for (rule of allRules(); track rule.id) {
              <article class="improvement-card">
                <div class="row-between">
                  <div>
                    <strong>{{ devName(rule.deviceKey) }} (<code>{{ rule.deviceKey }}</code>)</strong>
                    <code class="block-code">Regra ID: {{ rule.id }} · Versão v{{ rule.version }}</code>
                  </div>
                  <span class="badge" [class.sim]="rule.deliveryStatus === 'NOT_SENT'" [class.good]="rule.deliveryStatus !== 'NOT_SENT'">
                    Sincronização: {{ rule.deliveryStatus }}
                  </span>
                </div>

                <!-- 3 Camadas Obrigatórias da Seção 11 do SDD v1.2 -->
                <div class="inspector-meta-grid">
                  <div>
                    <span class="meta-label">CONFIGURAÇÃO DESEJADA (API)</span>
                    <strong>Pulso máx: {{ rule.maxPulseMs }} ms · Cooldown: {{ rule.cooldownMs }} ms</strong>
                  </div>
                  <div>
                    <span class="meta-label">ESTADO REPORTADO NA PLACA</span>
                    <strong>Modo {{ deviceMode(rule.deviceKey) }} ({{ rule.deliveryStatus === 'NOT_SENT' ? 'Pendente envio' : 'Confirmado' }})</strong>
                  </div>
                  <div>
                    <span class="meta-label">LIMITE FÍSICO ABSOLUTO (FIRMWARE)</span>
                    <strong>Pulso ≤ 3000 ms · Boia baixa bloqueia</strong>
                  </div>
                </div>

                <p class="small muted-text">
                  Última revisão em {{ rule.updatedAt | date:'dd/MM/yyyy HH:mm:ss' }} por <code>{{ rule.updatedBy }}</code>.
                </p>

                @if (store.auth.operator()) {
                  <div class="rule-edit-row">
                    <div class="field">
                      <label [for]="'max-' + rule.id">Duração máxima de pulso (ms · máx 3000)</label>
                      <input [id]="'max-' + rule.id" type="number" min="100" max="3000"
                             [ngModel]="draftMax(rule)" (ngModelChange)="setDraftMax(rule.id, $event)" />
                    </div>
                    <div class="field">
                      <label [for]="'cool-' + rule.id">Intervalo mínimo / Cooldown (ms)</label>
                      <input [id]="'cool-' + rule.id" type="number" min="1000" max="60000"
                             [ngModel]="draftCooldown(rule)" (ngModelChange)="setDraftCooldown(rule.id, $event)" />
                    </div>
                    <button type="button" class="button primary"
                            [disabled]="savingId() === rule.id"
                            (click)="saveRule(rule)">
                      {{ savingId() === rule.id ? 'Salvando…' : 'Salvar revisão (v' + (rule.version + 1) + ')' }}
                    </button>
                  </div>
                }
              </article>
            } @empty {
              <div class="empty-state compact">
                <span aria-hidden="true">⚙</span>
                <p>Nenhuma regra parametrizável retornada na última consulta.</p>
                <span>Verifique se os dispositivos foram inicializados na API.</span>
              </div>
            }

            @if (feedback()) {
              <p class="notice" [class.error]="isError()" role="status">{{ feedback() }}</p>
            }
          </div>
        </section>

        <!-- Matriz de Gatilhos -> Condições -> Ação -> Intertravamentos -->
        <section class="panel section-gap">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">LÓGICA DETERMINÍSTICA EMBARCADA</span>
              <h2>Gatilhos, condições e intertravamentos locais</h2>
            </div>
          </div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Regra / Domínio</th>
                  <th>Gatilho (Trigger)</th>
                  <th>Condição de Disparo</th>
                  <th>Ação Executada</th>
                  <th>Intertravamento Inegociável</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Crepuscular Iluminação 5V</strong></td>
                  <td>Leitura <code>illuminanceLux</code> (BH1750)</td>
                  <td>Modo <code>AUTO</code> e lux abaixo do limiar com histerese</td>
                  <td>Aciona <code>mainLightOn = true</code> (2 postes)</td>
                  <td>Em <code>INVALID</code> ou <code>STALE</code>, não comuta cegamente</td>
                </tr>
                <tr>
                  <td><strong>Irrigação Segura da Horta</strong></td>
                  <td>Umidade <code>soilHumidityPct</code> ou Pulso Manual</td>
                  <td><code>reservoirLow === false</code> e fora de cooldown</td>
                  <td>Pulso temporizado em <code>pumpOn</code></td>
                  <td>Corte físico imediato se boia indicar nível baixo ou timeout</td>
                </tr>
                <tr>
                  <td><strong>Travessia Semafórica Acessível</strong></td>
                  <td>Comando <code>REQUEST_CROSSING</code> ou Botoeira</td>
                  <td>Conclusão do tempo verde mínimo da via ativa</td>
                  <td>Transição <code>YELLOW → ALL_RED → PED_WALK</code> + Buzzer</td>
                  <td>Proibição absoluta de verde simultâneo nas vias A e B</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="panel info-panel">
        <span class="eyebrow">GOVERNANÇA DE AUTOMAÇÃO (SEÇÃO 1.3 &amp; 11)</span>
        <h2>Por que o firmware tem a palavra final?</h2>
        <p>Na Cidade Viva, a automação de segurança é executada e limitada nos microcontroladores ESP32; o backend .NET a versiona e audita; e o Angular a representa com fidelidade.</p>
        <ul class="plain-list">
          <li>Nenhuma parametrização remota pode ultrapassar os limites físicos absolutos gravados no firmware.</li>
          <li>Enquanto a placa não confirmar o recebimento da regra, o status permanece explicitamente como <code>NOT_SENT</code> / <code>PENDING_SYNC</code>.</li>
        </ul>
      </aside>
    </div>
  `
})
export class Automations {
  readonly store = inject(CityStore);
  private readonly api = inject(CityApi);
  readonly devName = deviceName;

  readonly allRules = computed(() =>
    this.store.devices().flatMap(d => d.automationRules ?? [])
  );

  private readonly edits = signal<Record<string, { maxPulseMs: number; cooldownMs: number }>>({});
  readonly savingId = signal('');
  readonly feedback = signal('');
  readonly isError = signal(false);

  deviceMode(key: string): string {
    return this.store.devices().find(d => d.deviceKey === key)?.mode ?? 'Não informado';
  }

  draftMax(rule: AutomationRule): number {
    return this.edits()[rule.id]?.maxPulseMs ?? rule.maxPulseMs;
  }

  draftCooldown(rule: AutomationRule): number {
    return this.edits()[rule.id]?.cooldownMs ?? rule.cooldownMs;
  }

  setDraftMax(id: string, value: number) {
    const rule = this.allRules().find(r => r.id === id);
    if (!rule) return;
    this.edits.update(curr => ({
      ...curr,
      [id]: { maxPulseMs: Number(value), cooldownMs: curr[id]?.cooldownMs ?? rule.cooldownMs }
    }));
  }

  setDraftCooldown(id: string, value: number) {
    const rule = this.allRules().find(r => r.id === id);
    if (!rule) return;
    this.edits.update(curr => ({
      ...curr,
      [id]: { maxPulseMs: curr[id]?.maxPulseMs ?? rule.maxPulseMs, cooldownMs: Number(value) }
    }));
  }

  async saveRule(rule: AutomationRule) {
    const maxPulseMs = this.draftMax(rule);
    const cooldownMs = this.draftCooldown(rule);
    this.savingId.set(rule.id);
    this.feedback.set('');
    this.isError.set(false);
    try {
      const updated = await this.api.updateRule(rule.id, maxPulseMs, cooldownMs, rule.version);
      await this.store.refresh();
      this.feedback.set(`Regra atualizada para v${updated.version} (Status: ${updated.deliveryStatus}).`);
    } catch (err) {
      this.isError.set(true);
      this.feedback.set(friendlyError(err));
    } finally {
      this.savingId.set('');
    }
  }
}
