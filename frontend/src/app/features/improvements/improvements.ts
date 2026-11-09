import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CityStore } from '../../core/city-store';
import {
  IMPROVEMENT_SOURCE_LABELS,
  IMPROVEMENT_STATUS_LABELS,
  ImprovementPriority,
  ImprovementSource,
  ImprovementsStore,
  ImprovementStatus
} from '../../core/improvements-store';
import { PageHeading } from '../../shared/page-heading';

@Component({
  selector: 'app-improvements',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeading],
  template: `
    <cv-page-heading
      eyebrow="09 / GESTÃO DE MELHORIAS CONTÍNUAS (SDD 003 · IMP-001 A IMP-005)"
      title="Backlog e validação de melhorias da cidade"
      subtitle="Transforme análises de consumo, alertas e sugestões do Assistente Gemini em propostas rastreáveis com baseline e plano de validação." />

    <!-- KPIs do Módulo de Melhorias -->
    <section class="overview-stats" aria-label="Resumo do backlog de melhorias">
      <article class="stat">
        <span class="stat-label">IDEIAS &amp; TRIAGEM</span>
        <div><strong>{{ store.counts().ideas }}</strong><span class="stat-icon" aria-hidden="true">✦</span></div>
        <p>Aguardando revisão ou aprovação do operador</p>
      </article>
      <article class="stat">
        <span class="stat-label">EM EXECUÇÃO &amp; VALIDAÇÃO</span>
        <div><strong>{{ store.counts().active }}</strong><span class="stat-icon energy" aria-hidden="true">⚙</span></div>
        <p>Propostas aprovadas com acompanhamento de baseline</p>
      </article>
      <article class="stat">
        <span class="stat-label">ORIGEM GEMINI / CONCLUÍDAS</span>
        <div>
          <strong>{{ store.counts().fromGemini }}</strong>
          <span class="stat-total">IA · {{ store.counts().done }} concluídas</span>
        </div>
        <p>Nenhuma sugestão da IA é executada sem revisão humana</p>
      </article>
    </section>

    <div class="content-columns">
      <!-- Lista / Kanban de Propostas -->
      <div>
        <section class="panel">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">CICLO DE VIDA AUDITADO</span>
              <h2>Quadro de propostas ({{ filteredItems().length }})</h2>
            </div>
            <div class="segmented" aria-label="Filtrar propostas">
              <button type="button" [class.selected]="filter() === 'ALL'" (click)="filter.set('ALL')">Todas ({{ store.items().length }})</button>
              <button type="button" [class.selected]="filter() === 'IDEA'" (click)="filter.set('IDEA')">Rascunhos / Triagem</button>
              <button type="button" [class.selected]="filter() === 'ACTIVE'" (click)="filter.set('ACTIVE')">Em Validação</button>
              <button type="button" [class.selected]="filter() === 'GEMINI'" (click)="filter.set('GEMINI')">Sugeridas por IA</button>
            </div>
          </div>

          <div class="module-body">
            @for (item of filteredItems(); track item.id) {
              <article class="improvement-card">
                <div class="row-between">
                  <div class="button-group">
                    <code>{{ item.id }}</code>
                    <span class="badge" [class.sim]="item.source === 'GEMINI'" [class.warn]="item.source === 'RULE'">
                      {{ sourceLabel[item.source] }}
                    </span>
                    <span class="badge muted">Prioridade {{ item.priority }} · Esforço {{ item.effort }}</span>
                  </div>
                  <span class="badge"
                        [class.good]="item.status === 'DONE' || item.status === 'VALIDATING'"
                        [class.pending]="item.status === 'IN_PROGRESS' || item.status === 'APPROVED'">
                    {{ statusLabel[item.status] }}
                  </span>
                </div>

                <h3>{{ item.title }}</h3>
                <p class="small"><strong>Problema observado:</strong> {{ item.problem }}</p>
                <p class="small"><strong>Hipótese de engenharia:</strong> {{ item.hypothesis }}</p>

                <div class="improvement-meta-box">
                  <div><strong>Baseline / Evidência:</strong> {{ item.baselineMetric }}</div>
                  <div><strong>Plano de validação:</strong> {{ item.validationPlan }}</div>
                  <div><strong>Proveniência:</strong> {{ item.provenanceNote }}</div>
                </div>

                <div class="row-between improvement-card-footer">
                  <span class="small muted-text">
                    Zona: <code>{{ item.zoneId }}</code>
                    @if (item.assetId) { · Ativo: <code>{{ item.assetId }}</code> }
                    @if (item.deviceKey) { · Controlador: <code>{{ item.deviceKey }}</code> }
                    · Atualizado em {{ item.updatedAt | date:'dd/MM HH:mm' }}
                  </span>
                  <div class="button-group">
                    @for (next of nextStatuses(item.status); track next) {
                      <button type="button" class="button secondary compact-btn"
                              [disabled]="!cityStore.auth.operator()"
                              (click)="advance(item.id, next)">
                        Mover para {{ statusLabel[next] }} →
                      </button>
                    }
                  </div>
                </div>

                <details>
                  <summary>Trilha de auditoria ({{ item.activities.length }} eventos)</summary>
                  <ul class="plain-list">
                    @for (act of item.activities; track act.at) {
                      <li><time>{{ act.at | date:'dd/MM HH:mm:ss' }}</time> · <strong>{{ act.actor }}</strong>: {{ act.action }}</li>
                    }
                  </ul>
                </details>
              </article>
            }
          </div>
        </section>
      </div>

      <!-- Formulário de Nova Proposta de Melhoria -->
      <aside class="panel info-panel">
        <span class="eyebrow">NOVA PROPOSTA (IMP-001)</span>
        <h2>Registrar hipótese de melhoria</h2>
        <p class="small muted-text">Propostas criadas ficam em estado <code>IDEA</code> até triagem. Nenhuma proposta altera regras de hardware automaticamente.</p>

        <form (submit)="$event.preventDefault(); submitProposal()">
          <div class="field">
            <label for="imp-title">Título da melhoria</label>
            <input id="imp-title" type="text" required [(ngModel)]="title" name="title" placeholder="Ex.: Ajustar histerese do sensor de luminosidade" />
          </div>

          <div class="field section-gap">
            <label for="imp-zone">Zona / Setor da maquete</label>
            <select id="imp-zone" [(ngModel)]="zoneId" name="zoneId">
              <option value="residential">Residencial &amp; Iluminação 5V</option>
              <option value="water">Hidráulica, Reservatório &amp; Horta</option>
              <option value="mobility">Mobilidade &amp; Travessia Acessível</option>
              <option value="solar">Circuito Solar Autônomo</option>
              <option value="control">Centro de Controle ESP32</option>
            </select>
          </div>

          <div class="field section-gap">
            <label for="imp-source">Origem da identificação</label>
            <select id="imp-source" [(ngModel)]="source" name="source">
              <option value="MANUAL">Observação Operacional (MANUAL)</option>
              <option value="RULE">Alerta / Regra de Limite (RULE)</option>
              <option value="GEMINI">Sugestão Assistente Gemini (GEMINI)</option>
            </select>
          </div>

          <div class="field section-gap">
            <label for="imp-priority">Prioridade</label>
            <select id="imp-priority" [(ngModel)]="priority" name="priority">
              <option value="HIGH">Alta (HIGH)</option>
              <option value="MEDIUM">Média (MEDIUM)</option>
              <option value="LOW">Baixa (LOW)</option>
            </select>
          </div>

          <div class="field section-gap">
            <label for="imp-problem">Problema e evidência observada</label>
            <textarea id="imp-problem" rows="2" required [(ngModel)]="problem" name="problem"
              placeholder="Descreva o comportamento observado na telemetria ou nos alertas."></textarea>
          </div>

          <div class="field section-gap">
            <label for="imp-hypothesis">Hipótese e plano de validação</label>
            <textarea id="imp-hypothesis" rows="2" required [(ngModel)]="hypothesis" name="hypothesis"
              placeholder="Como validar antes/depois com métricas reais?"></textarea>
          </div>

          <div class="field section-gap">
            <label for="imp-baseline">Métrica de baseline</label>
            <input id="imp-baseline" type="text" [(ngModel)]="baselineMetric" name="baselineMetric"
              placeholder="Ex.: illuminanceLux / contagem de alertas RESERVOIR_LOW" />
          </div>

          <button type="submit" class="button primary section-gap" [disabled]="!title.trim() || !problem.trim() || !hypothesis.trim()">
            Registrar proposta no Kanban
          </button>
        </form>
      </aside>
    </div>
  `
})
export class Improvements {
  readonly store = inject(ImprovementsStore);
  readonly cityStore = inject(CityStore);

  readonly statusLabel = IMPROVEMENT_STATUS_LABELS;
  readonly sourceLabel = IMPROVEMENT_SOURCE_LABELS;
  readonly filter = signal<'ALL' | 'IDEA' | 'ACTIVE' | 'GEMINI'>('ALL');

  title = '';
  zoneId = 'residential';
  assetId: string | undefined = undefined;
  deviceKey: 'esp32-energy' | 'esp32-water' | undefined = 'esp32-energy';
  source: ImprovementSource = 'MANUAL';
  priority: ImprovementPriority = 'MEDIUM';
  problem = '';
  hypothesis = '';
  baselineMetric = 'Série temporal de 24h (VALID)';

  readonly filteredItems = computed(() => {
    const f = this.filter();
    const list = this.store.items();
    if (f === 'IDEA') return list.filter(i => i.status === 'IDEA' || i.status === 'TRIAGE');
    if (f === 'ACTIVE') return list.filter(i => ['APPROVED', 'PLANNED', 'IN_PROGRESS', 'VALIDATING'].includes(i.status));
    if (f === 'GEMINI') return list.filter(i => i.source === 'GEMINI');
    return list;
  });

  constructor() {
    effect(() => {
      const draft = this.store.selectedAssetDraft();
      if (draft) {
        this.title = draft.suggestionText ?? '';
        this.zoneId = draft.zoneId ?? 'residential';
        this.assetId = draft.assetId;
        this.deviceKey = draft.deviceKey;
      }
    });
  }

  nextStatuses(current: ImprovementStatus): ImprovementStatus[] {
    const flow: Record<ImprovementStatus, ImprovementStatus[]> = {
      IDEA: ['TRIAGE', 'APPROVED'],
      TRIAGE: ['APPROVED', 'REJECTED'],
      APPROVED: ['IN_PROGRESS'],
      PLANNED: ['IN_PROGRESS'],
      IN_PROGRESS: ['VALIDATING'],
      VALIDATING: ['DONE', 'IN_PROGRESS'],
      DONE: [],
      REJECTED: ['TRIAGE']
    };
    return flow[current] ?? [];
  }

  advance(id: string, next: ImprovementStatus) {
    this.store.transition(id, next, this.cityStore.auth.user()?.username ?? 'operator');
  }

  submitProposal() {
    if (!this.title.trim() || !this.problem.trim() || !this.hypothesis.trim()) return;
    this.store.create({
      title: this.title,
      problem: this.problem,
      hypothesis: this.hypothesis,
      zoneId: this.zoneId,
      assetId: this.assetId,
      deviceKey: this.deviceKey,
      source: this.source,
      priority: this.priority,
      impact: 'Melhoria operacional rastreada no SDD 003',
      effort: 'BAIXO',
      baselineMetric: this.baselineMetric,
      validationPlan: this.hypothesis,
      provenanceNote: 'Registrada pelo formulário de Gestão de Melhorias.',
      actor: this.cityStore.auth.user()?.username ?? 'operator'
    });
    this.title = '';
    this.problem = '';
    this.hypothesis = '';
    this.store.selectedAssetDraft.set(null);
  }
}
