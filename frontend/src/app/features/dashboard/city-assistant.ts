import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AssistantAnswer, CityApi, friendlyError } from '../../core/api';
import { CityStore } from '../../core/city-store';
import { ImprovementsStore } from '../../core/improvements-store';
import { causeLabel, numberMetric, originLabel, qualityLabel, reportedBoolean } from '../../core/presentation';

@Component({
  selector: 'cv-city-assistant',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <section class="panel dashboard-module">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">INTELIGÊNCIA CONTEXTUAL · READ-ONLY</span>
          <h2>Assistente Cidade Viva (Gemini)</h2>
        </div>
        <div class="button-group">
          <span class="badge" [class.good]="available() === true" [class.sim]="available() === false">
            {{ available() === null ? 'Verificando…' : available() ? 'Gemini Cloud Ativo' : 'Modo Diagnóstico Local (API Key pendente)' }}
          </span>
          <a routerLink="/assistente" class="text-link">Expandir chat ↗</a>
        </div>
      </div>
      <div class="module-body">
        <p class="muted-text">
          Explica o estado observado, analisa alertas e propõe rascunhos de melhoria auditáveis.
          <strong>A IA nunca envia comandos físicos MQTT.</strong>
        </p>

        <div class="assistant-context-bar">
          <span><strong>Escopo atual:</strong> <code>{{ assetLabel() || deviceKey() || 'Visão global da cidade' }}</code></span>
          @if (available() === false) {
            <button class="text-button" type="button" (click)="checkAvailability()">Revalidar Gemini API ↻</button>
          }
        </div>

        <!-- Sugestões rápidas de consulta (AI-READ, AI-ANALYZE, AI-IMPROVE) -->
        <div class="quick-prompts" aria-label="Perguntas sugeridas">
          @for (item of suggestedPrompts; track item) {
            <button type="button" class="chip-btn" [disabled]="busy()" (click)="usePrompt(item)">
              ✦ {{ item }}
            </button>
          }
        </div>

        <form (submit)="$event.preventDefault(); ask()">
          <label for="city-question">Pergunta ao assistente</label>
          <textarea id="city-question" rows="3" maxlength="1000" required
            [value]="question()" (input)="question.set($any($event.target).value)"
            placeholder="Ex.: Por que a bomba está bloqueada ou que melhoria você sugere para este setor?"></textarea>
          <div class="row-between">
            <span class="small muted-text">
              {{ available() ? 'Consulta processada via backend (/api/v1/ai/chat) com chave protegida no servidor.' : 'Gemini Cloud desabilitado no .env: usando motor de diagnóstico local sobre o snapshot atual.' }}
            </span>
            <button type="submit" class="button primary" [disabled]="busy() || !question().trim()">
              {{ busy() ? 'Analisando contexto…' : 'Consultar assistente' }}
            </button>
          </div>
        </form>

        @if (error()) {
          <p class="notice error" role="alert">{{ error() }}</p>
        }

        @if (answer(); as result) {
          <div class="assistant-answer" aria-live="polite">
            <div class="row-between">
              <span class="eyebrow">RESPOSTA FUNDAMENTADA EM TELEMETRIA</span>
              <span class="badge" [class.good]="usedCloud()" [class.sim]="!usedCloud()">
                {{ usedCloud() ? 'Fonte: Gemini API' : 'Fonte: Diagnóstico Local SDD' }}
              </span>
            </div>
            <p class="small muted-text"><strong>Pergunta:</strong> {{ answeredQuestion() }}</p>
            <div class="assistant-text">{{ result.answer }}</div>

            <div class="assistant-citations">
              <span class="eyebrow">CITAÇÕES E EVIDÊNCIAS ({{ result.contextAt | date:'dd/MM HH:mm:ss' }})</span>
              <ul class="plain-list">
                @for (source of result.sources; track source.deviceKey) {
                  <li>
                    <code>{{ source.deviceKey }}</code> · {{ origin(source.origin) }} · Qualidade: {{ quality(source.quality) }}
                    @if (source.isStale) { · <strong>desatualizado</strong> }
                    · {{ source.lastTelemetryAt ? (source.lastTelemetryAt | date:'dd/MM HH:mm:ss') : 'sem telemetria' }}
                  </li>
                }
              </ul>
            </div>

            <!-- Ação AI-IMPROVE: Criar rascunho de melhoria somente com confirmação humana -->
            <div class="assistant-draft-card">
              <div>
                <strong>Transformar em Proposta de Melhoria (Módulo Improvements)</strong>
                <p class="small muted-text">Cria um rascunho com status <code>IDEA</code> e origem <code>GEMINI</code> para revisão humana.</p>
              </div>
              @if (draftCreatedId()) {
                <a routerLink="/melhorias" class="button secondary">Rascunho {{ draftCreatedId() }} criado · Ver Kanban ↗</a>
              } @else {
                <button type="button" class="button secondary" (click)="createImprovementFromAnswer()">
                  + Criar rascunho de melhoria
                </button>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `
})
export class CityAssistant {
  private readonly api = inject(CityApi);
  private readonly store = inject(CityStore);
  private readonly improvements = inject(ImprovementsStore);

  readonly deviceKey = input<string>();
  readonly assetLabel = input<string>();
  readonly presetQuestion = input<string>();

  readonly available = signal<boolean | null>(null);
  readonly availabilityError = signal('');
  readonly busy = signal(false);
  readonly question = signal('');
  readonly answeredQuestion = signal('');
  readonly error = signal('');
  readonly answer = signal<AssistantAnswer | null>(null);
  readonly usedCloud = signal(false);
  readonly draftCreatedId = signal('');
  readonly origin = originLabel;
  readonly quality = qualityLabel;

  readonly suggestedPrompts = [
    'O que está ligado e qual a qualidade das leituras?',
    'Por que a bomba de irrigação está bloqueada?',
    'Explique os alertas ativos e como tratá-los',
    'Sugira uma melhoria baseada nos dados atuais'
  ];

  constructor() {
    void this.checkAvailability();
    effect(() => {
      const q = this.presetQuestion();
      if (q && q.trim()) {
        this.question.set(q);
        void this.ask();
      }
    });
  }

  async checkAvailability() {
    this.available.set(null);
    this.availabilityError.set('');
    try {
      this.available.set((await this.api.assistantAvailability()).available);
    } catch {
      this.availabilityError.set('API Gemini não configurada no backend (.env).');
      this.available.set(false);
    }
  }

  usePrompt(promptText: string) {
    this.question.set(promptText);
    void this.ask();
  }

  async ask() {
    const question = this.question().trim();
    if (this.busy() || !question || question.length > 1000) return;
    this.busy.set(true);
    this.error.set('');
    this.draftCreatedId.set('');

    if (this.available()) {
      try {
        const key = this.deviceKey() === 'esp32-energy' || this.deviceKey() === 'esp32-water' ? this.deviceKey() : undefined;
        const answer = await this.api.askAssistant(question, key);
        this.answeredQuestion.set(question);
        this.usedCloud.set(true);
        this.answer.set(answer);
        this.busy.set(false);
        return;
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 503) {
          this.available.set(false);
        } else {
          this.error.set(error instanceof HttpErrorResponse && error.status === 429
            ? 'Limite de consultas atingido. Aguarde antes de tentar novamente.'
            : friendlyError(error));
          this.busy.set(false);
          return;
        }
      }
    }

    // Fallback analítico local (SDD v1.2 Seção 13.4) quando Gemini__ApiKey não está ativo no .env
    const localResult = this.buildLocalDiagnosticAnswer(question);
    this.answeredQuestion.set(question);
    this.usedCloud.set(false);
    this.answer.set(localResult);
    this.busy.set(false);
  }

  private buildLocalDiagnosticAnswer(question: string): AssistantAnswer {
    const devices = this.store.devices();
    const energy = this.store.energy();
    const water = this.store.water();
    const activeAlerts = this.store.activeAlerts();

    const lux = numberMetric(energy, 'illuminanceLux');
    const lightState = reportedBoolean(energy, 'mainLightOn');
    const humidity = numberMetric(water, 'soilHumidityPct');
    const pumpState = reportedBoolean(water, 'pumpOn');
    const reservoirLow = water?.measurements['reservoirLow'];

    const lines: string[] = [];
    lines.push(`1. Estado observado no snapshot atual:`);
    if (energy) {
      lines.push(`• esp32-energy (${energy.online && !energy.isStale ? 'Online' : 'Offline/Desatualizado'} · ${originLabel(energy.origin)}): Iluminação principal = ${lightState}, Modo = ${energy.mode ?? 'Não informado'}, Luminosidade = ${lux !== null ? lux + ' lx' : 'sem leitura'}, Semáforo = ${energy.actuators['trafficState'] || 'sem fase'}.`);
    } else {
      lines.push(`• esp32-energy: Sem telemetria carregada na última consulta.`);
    }

    if (water) {
      lines.push(`• esp32-water (${water.online && !water.isStale ? 'Online' : 'Offline/Desatualizado'} · ${originLabel(water.origin)}): Bomba = ${pumpState} (sem comprovação de vazão), Modo = ${water.mode ?? 'Não informado'}, Boia reservatório = ${reservoirLow === true ? 'NÍVEL BAIXO (bomba bloqueada no firmware)' : reservoirLow === false ? 'Normal' : 'Desconhecido'}, Umidade amostra = ${humidity !== null ? humidity + '%' : 'sem leitura'}.`);
    } else {
      lines.push(`• esp32-water: Sem telemetria carregada na última consulta.`);
    }

    if (activeAlerts.length > 0) {
      lines.push(`\n2. Ocorrências ativas (${activeAlerts.length}):`);
      for (const alert of activeAlerts.slice(0, 3)) {
        lines.push(`• ${causeLabel(alert.cause)} em ${alert.deviceKey} (${alert.acknowledgedAt ? 'reconhecido, causa ainda ativa' : 'aguardando reconhecimento'}).`);
      }
    } else {
      lines.push(`\n2. Ocorrências: Nenhum alerta ativo registrado no momento.`);
    }

    lines.push(`\n3. Hipótese de melhoria sugerida (para revisão humana):`);
    if (reservoirLow !== false || question.toLowerCase().includes('bomba') || question.toLowerCase().includes('irrig')) {
      lines.push(`• Hipótese: Validar retorno hidráulico da horta e histerese da boia do reservatório antes de novos pulsos manuais. Nunca contornar o intertravamento físico do esp32-water.`);
    } else if (question.toLowerCase().includes('solar')) {
      lines.push(`• Hipótese: Os 4 postes solares operam em circuito autônomo não instrumentado. Para auferir geração real, planejar melhoria com sensor INA219 dedicado.`);
    } else {
      lines.push(`• Hipótese: Ajustar limiar crepuscular e histerese de illuminanceLux no esp32-energy e monitorar frequência de comutação de mainLightOn antes/depois.`);
    }

    return {
      answer: lines.join('\n'),
      contextAt: new Date().toISOString(),
      sources: devices.map(d => ({
        deviceKey: d.deviceKey,
        origin: d.origin,
        quality: d.quality,
        lastTelemetryAt: d.lastTelemetryAt,
        isStale: d.isStale
      }))
    };
  }

  createImprovementFromAnswer() {
    const res = this.answer();
    if (!res) return;
    const key = this.deviceKey() === 'esp32-water' ? 'esp32-water' : 'esp32-energy';
    const created = this.improvements.create({
      title: `Melhoria sugerida via Assistente: ${this.answeredQuestion().slice(0, 65)}`,
      problem: `Consulta operacional: "${this.answeredQuestion()}"`,
      hypothesis: res.answer.slice(0, 360),
      zoneId: key === 'esp32-water' ? 'water' : 'residential',
      deviceKey: key,
      source: 'GEMINI',
      priority: 'MEDIUM',
      impact: 'Melhoria de estabilidade operacional e observabilidade baseada em evidências',
      effort: 'BAIXO',
      baselineMetric: key === 'esp32-water' ? 'soilHumidityPct / reservoirLow' : 'illuminanceLux / mainLightOn',
      validationPlan: 'Comparar série temporal de 24h antes e após ajuste autorizado.',
      provenanceNote: `Gerado a partir de consulta em ${new Date(res.contextAt).toLocaleString('pt-BR')}.`,
      actor: this.store.auth.user()?.username ?? 'operator'
    });
    this.draftCreatedId.set(created.id);
  }
}
