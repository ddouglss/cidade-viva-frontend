import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../../core/city-store';
import { ImprovementsStore } from '../../core/improvements-store';
import { numberMetric, originLabel, reportedBoolean } from '../../core/presentation';
import { CityCanvas2D } from '../../shared/city-canvas-2d';
import { PageHeading } from '../../shared/page-heading';

interface PresentationStep {
  step: number;
  eyebrow: string;
  title: string;
  summary: string;
  highlights: string[];
  route: string;
  routeLabel: string;
}

@Component({
  selector: 'app-presentation-page',
  standalone: true,
  imports: [RouterLink, PageHeading, CityCanvas2D],
  template: `
    <cv-page-heading
      eyebrow="03 / MODO DE APRESENTAÇÃO ACADÊMICA & BANCA (SEÇÃO 15 · FE-113)"
      title="Roteiro guiado de demonstração — Cidade Viva"
      subtitle="Visualização de alto contraste para projetor e avaliadores, com transparência entre dados físicos, simulados e circuitos autônomos." />

    <!-- HUD de Status Permanente para Projetor (Seção 15 do Doc 00) -->
    <section class="presentation-hud" aria-label="HUD de status da demonstração">
      <div class="hud-badge-group">
        <span class="badge" [class.sim]="store.simulated()" [class.good]="!store.simulated()">
          {{ store.simulated() ? 'MODO DEMONSTRAÇÃO COM DADOS DE SIMULAÇÃO' : 'LABORATÓRIO FÍSICO CONECTADO' }}
        </span>
        <span class="badge" [class.good]="store.live.status() === 'connected'">
          SignalR: {{ store.live.status() === 'connected' ? 'Tempo real conectado' : 'Reconectando/Snapshot REST' }}
        </span>
      </div>
      <div class="hud-metrics">
        <span><strong>ESP32 Energia:</strong> {{ state(store.energy(), 'mainLightOn') }} · {{ metric(store.energy(), 'illuminanceLux') ?? '—' }} lx</span>
        <span><strong>ESP32 Hidráulica:</strong> Bomba {{ state(store.water(), 'pumpOn') }} · Umidade {{ metric(store.water(), 'soilHumidityPct') ?? '—' }}%</span>
        <span><strong>Alertas ativos:</strong> {{ store.activeAlerts().length }}</span>
        <span><strong>Melhorias registradas:</strong> {{ improvements.counts().total }}</span>
      </div>
    </section>

    <!-- Navegador Sequencial de Etapas da Apresentação -->
    <section class="panel section-gap">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">{{ current().eyebrow }}</span>
          <h2>Etapa {{ current().step }} de {{ steps.length }} — {{ current().title }}</h2>
        </div>
        <div class="button-group">
          <button type="button" class="button secondary" [disabled]="index() === 0" (click)="prev()">← Etapa anterior</button>
          <button type="button" class="button primary" [disabled]="index() === steps.length - 1" (click)="next()">Próxima etapa →</button>
        </div>
      </div>

      <div class="module-body">
        <div class="presentation-step-pills" role="tablist" aria-label="Etapas do roteiro">
          @for (s of steps; track s.step; let idx = $index) {
            <button type="button" class="chip-btn" [class.active]="index() === idx" (click)="index.set(idx)">
              {{ s.step }}. {{ s.title }}
            </button>
          }
        </div>

        <div class="presentation-stage-card">
          <p class="presentation-lead">{{ current().summary }}</p>
          <ul class="plain-list presentation-highlights">
            @for (point of current().highlights; track point) {
              <li>{{ point }}</li>
            }
          </ul>
          <div class="button-group" style="margin-top: 16px;">
            <a [routerLink]="current().route" class="button secondary">{{ current().routeLabel }} ↗</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Planta Interativa 2D/3D Integrada ao Modo Apresentação -->
    <section class="panel section-gap">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">DEMONSTRAÇÃO AO VIVO DA MAQUETE</span>
          <h2>Planta interativa durante a apresentação</h2>
        </div>
      </div>
      <div class="module-body">
        <cv-city-canvas-2d [fullMode]="true" />
      </div>
    </section>
  `
})
export class PresentationPage {
  readonly store = inject(CityStore);
  readonly improvements = inject(ImprovementsStore);
  readonly metric = numberMetric;
  readonly state = reportedBoolean;
  readonly origin = originLabel;

  readonly steps: PresentationStep[] = [
    {
      step: 1,
      eyebrow: 'PASSO 01 / ARQUITETURA E PRINCÍPIOS',
      title: 'Arquitetura Fim-a-Fim',
      summary: 'A Cidade Viva integra dois controladores ESP32 (C++/PlatformIO), Broker MQTT, API ASP.NET Core (.NET 10), PostgreSQL, SignalR e Angular.',
      highlights: [
        'Separação estrita entre medição física (PHYSICAL_SENSOR), entrada simulada (SIMULATED_INPUT) e grandezas não instrumentadas.',
        'Fluxo de comando determinístico: HTTP 202 Accepted → PENDING → Publicação MQTT QoS 1 → Validação no Firmware → ACK → SignalR.',
        'Proteções locais nos ESP32 continuam operantes mesmo sem rede ou backend.'
      ],
      route: '/dispositivos',
      routeLabel: 'Ver controladores e conectividade'
    },
    {
      step: 2,
      eyebrow: 'PASSO 02 / GÊMEO VISUAL INTERATIVO',
      title: 'Cidade 2D e Vínculos de Ativos',
      summary: 'A planta SVG 2D (com projeção isométrica opcional) projeta o estado real dos 12 ativos da maquete (~100×80 cm).',
      highlights: [
        'Cada ativo possui ID canônico (ex.: streetlight-main-01) e binding explícito para deviceKey + capabilityId.',
        'Acessível integralmente por teclado e acompanhada de inventário tabular equivalente.',
        'O clique inspeciona estado, origem, qualidade e abre apenas comandos autorizados para o papel do usuário.'
      ],
      route: '/cidade',
      routeLabel: 'Abrir Cidade Interativa'
    },
    {
      step: 3,
      eyebrow: 'PASSO 03 / ENERGIA PRINCIPAL E SOLAR',
      title: 'Iluminação 5V & Solar Autônomo',
      summary: 'O ramal principal de 5V alimenta dois postes com modo automático por sensor BH1750 (lux) ou comando manual auditado.',
      highlights: [
        'Os dois postes principais compartilham o estado reportado mainLightOn.',
        'Os 4 postes solares compõem um circuito físico independente (Painel PV → Controlador → Bateria → LED).',
        'Transparência científica: sem sensor INA219 no circuito solar, a UI informa "Não instrumentado" em vez de inventar potência.'
      ],
      route: '/energia',
      routeLabel: 'Abrir módulo de Energia'
    },
    {
      step: 4,
      eyebrow: 'PASSO 04 / HIDRÁULICA E SEGURANÇA LOCAL',
      title: 'Irrigação, Reservatório e Horta',
      summary: 'A bomba de 5V irriga a horta demonstrativa com retorno ao reservatório e intertravamento físico por sensor de nível (boia).',
      highlights: [
        'Se reservoirLow for verdadeiro ou indeterminado, o firmware bloqueia imediatamente o pulso de bomba.',
        'A leitura de umidade (soilHumidityPct e soilAdcRaw) exibe sempre sua etiqueta de origem (Sensor Físico ou Simulação).',
        'O acionamento de pumpOn indica comando elétrico aplicado, sem alegar medição de vazão volumétrica.'
      ],
      route: '/hidraulica',
      routeLabel: 'Abrir módulo de Hidráulica'
    },
    {
      step: 5,
      eyebrow: 'PASSO 05 / MOBILIDADE E ACESSIBILIDADE',
      title: 'Semáforos, Travessia e Buzzer',
      summary: 'O cruzamento central opera sob máquina de estados no controlador, garantindo fases seguras e travessia assistida.',
      highlights: [
        'Solicitações de travessia entram na fila segura do controlador, sem jamais causar verde conflitante.',
        'O buzzer sonoro de acessibilidade para pedestres é distinto do sinalizador de alertas de emergência.',
        'A cancela veicular permanece sob feature flag ("Aguardando hardware") até homologação de motor e fim de curso.'
      ],
      route: '/mobilidade',
      routeLabel: 'Abrir módulo de Mobilidade'
    },
    {
      step: 6,
      eyebrow: 'PASSO 06 / INCIDENTES E AUTOMAÇÕES',
      title: 'Alertas, Regras e Confiabilidade',
      summary: 'Ocorrências ativas exigem reconhecimento explícito, que registra ciência sem apagar uma causa física ainda ativa.',
      highlights: [
        'Regras de pulso máximo e cooldown são versionadas na API e respeitam o teto absoluto do firmware.',
        'Em caso de perda de resposta HTTP ou reconexão SignalR, o frontend ressincroniza o snapshot sem duplicar comandos físicos.'
      ],
      route: '/alertas',
      routeLabel: 'Abrir Centro de Alertas'
    },
    {
      step: 7,
      eyebrow: 'PASSO 07 / INTELIGÊNCIA E MELHORIA CONTÍNUA',
      title: 'Assistente Gemini & Kanban de Melhorias',
      summary: 'O Assistente Cidade Viva analisa a telemetria em modo read-only e ajuda a formular propostas formais de melhoria.',
      highlights: [
        'Chave da API Gemini protegida exclusivamente no backend .NET; zero acesso direto do modelo ao broker MQTT.',
        'Sugestões da IA viram rascunhos (IDEA) no Kanban de Melhorias apenas mediante confirmação humana.',
        'Cada melhoria registra problema, hipótese, baseline e plano de validação antes/depois.'
      ],
      route: '/melhorias',
      routeLabel: 'Abrir Gestão de Melhorias'
    }
  ];

  readonly index = signal(0);
  readonly current = computed(() => this.steps[this.index()]);

  prev() {
    if (this.index() > 0) this.index.update(i => i - 1);
  }

  next() {
    if (this.index() < this.steps.length - 1) this.index.update(i => i + 1);
  }
}
