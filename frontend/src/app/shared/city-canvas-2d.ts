import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CITY_LAYERS,
  CityLayerId,
  DEFAULT_CITY_ASSETS,
  resolveAssetSnapshot,
  ResolvedAssetSnapshot
} from '../core/city-scene';
import { CityStore } from '../core/city-store';
import { ImprovementsStore } from '../core/improvements-store';
import { causeLabel } from '../core/presentation';

@Component({
  selector: 'cv-city-canvas-2d',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="city-twin-shell" [class.full-mode]="fullMode()">
      <!-- Toolbar da Cidade Interativa -->
      <div class="city-toolbar" role="toolbar" aria-label="Controles da planta da cidade">
        <div class="city-layer-chips" role="group" aria-label="Camadas da cidade">
          <button type="button" class="chip-btn" [class.active]="activeLayer() === 'ALL'" (click)="activeLayer.set('ALL')">
            Todas as camadas ({{ snapshots().length }})
          </button>
          @for (layer of layers; track layer.id) {
            <button type="button" class="chip-btn" [class.active]="activeLayer() === layer.id" (click)="activeLayer.set(layer.id)">
              <span class="chip-dot" [style.background]="layer.color" aria-hidden="true"></span>
              {{ layer.label }}
            </button>
          }
        </div>
        <div class="city-view-controls">
          <div class="segmented" aria-label="Modo de projeção">
            <button type="button" [class.selected]="!isometric3D()" [attr.aria-pressed]="!isometric3D()" (click)="isometric3D.set(false)">2D Operacional</button>
            <button type="button" [class.selected]="isometric3D()" [attr.aria-pressed]="isometric3D()" (click)="isometric3D.set(true)">3D Isométrico</button>
          </div>
          <div class="zoom-group" aria-label="Zoom do mapa">
            <button type="button" class="chip-btn" (click)="adjustZoom(-0.15)" aria-label="Reduzir zoom">−</button>
            <button type="button" class="chip-btn" (click)="zoom.set(1)" aria-label="Restaurar zoom 100%">{{ (zoom() * 100) | number:'1.0-0' }}%</button>
            <button type="button" class="chip-btn" (click)="adjustZoom(0.15)" aria-label="Ampliar zoom">+</button>
          </div>
        </div>
      </div>

      @if (isometric3D()) {
        <div class="iso-banner" role="status">
          <span><strong>Projeção 3D Isométrica Leve (WebGL-free fallback)</strong> · Mesmos IDs canônicos (<code>SceneAsset</code>) e estado compartilhado em tempo real com o 2D.</span>
          <button type="button" class="text-button" (click)="isometric3D.set(false)">Voltar ao 2D plano</button>
        </div>
      }

      <div class="city-workspace-split">
        <!-- Canvas SVG da Maquete (~100x80cm) -->
        <div class="city-canvas-viewport">
          <div class="city-svg-stage" [class.iso-stage]="isometric3D()" [style.transform]="stageTransform()">
            <svg class="city-interactive-svg" viewBox="0 0 740 360" role="group" aria-label="Planta interativa 2D da maquete Cidade Viva">
              <defs>
                <radialGradient id="lightGlowOn" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#ffe57f" stop-opacity="0.85"/>
                  <stop offset="100%" stop-color="#ffe57f" stop-opacity="0"/>
                </radialGradient>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dce5da" stroke-width="0.7"/>
                </pattern>
              </defs>

              <!-- Base da Maquete 100x80cm -->
              <rect width="740" height="360" rx="12" fill="#edf3ea"/>
              <rect width="740" height="360" rx="12" fill="url(#gridPattern)"/>

              <!-- Quadrantes Setoriais -->
              <!-- Setor Noroeste: Residencial & Energia Principal -->
              <rect x="16" y="14" width="308" height="142" rx="10" fill="#e1ecdd" stroke="#c8d9c3" stroke-width="1.5"/>
              <text x="28" y="32" fill="#486349" font-size="9" font-weight="700" letter-spacing="1.2">ZONA 01 · RESIDENCIAL &amp; RAMAL PRINCIPAL 5V</text>

              <!-- Edificações Residenciais / Escola / Biblioteca -->
              <g fill="#c6d8c0" stroke="#96b28f" stroke-width="1.2">
                <rect x="34" y="46" width="58" height="44" rx="4"/>
                <rect x="42" y="54" width="14" height="10" fill="#eef5eb"/>
                <rect x="64" y="54" width="14" height="10" fill="#eef5eb"/>
                <rect x="135" y="92" width="76" height="48" rx="4"/>
                <rect x="145" y="102" width="18" height="12" fill="#eef5eb"/>
                <rect x="172" y="102" width="26" height="12" fill="#eef5eb"/>
                <rect x="256" y="44" width="52" height="52" rx="4"/>
              </g>

              <!-- Setor Nordeste: Hidráulica, Reservatório e Horta -->
              <rect x="386" y="14" width="338" height="142" rx="10" fill="#dcebef" stroke="#bdd5dc" stroke-width="1.5"/>
              <text x="400" y="32" fill="#2c6073" font-size="9" font-weight="700" letter-spacing="1.2">ZONA 02 · HIDRÁULICA, RESERVATÓRIO &amp; HORTA</text>

              <!-- Tanque Reservatório e Tubulação -->
              <rect x="404" y="46" width="88" height="72" rx="8" fill="#c7e0e8" stroke="#689eb0" stroke-width="1.5"/>
              <rect x="410" y="68" width="76" height="44" rx="5" [attr.fill]="reservoirLow() ? '#f3d8b6' : '#6cb4cc'" opacity="0.75"/>
              <!-- Tubulação Reservatório -> Bomba -> Horta -->
              <path d="M 492 80 H 596 V 98 H 614" fill="none" stroke="#6296a8" stroke-width="6" stroke-linecap="round"/>
              <path d="M 492 80 H 596 V 98 H 614" fill="none" [attr.stroke]="pumpOn() ? '#bdf0ff' : '#9dc2cf'" stroke-width="2.5" stroke-dasharray="6 5"/>
              <!-- Retorno Horta -> Reservatório -->
              <path d="M 642 138 H 448 V 118" fill="none" stroke="#8ab0bc" stroke-width="2" stroke-dasharray="4 4"/>

              <!-- Canteiros da Horta Demonstrativa -->
              <g transform="translate(604, 48)">
                <rect width="104" height="92" rx="8" fill="#cce0c8" stroke="#8eb088" stroke-width="1.5"/>
                <rect x="10" y="12" width="84" height="18" rx="4" fill="#8fb587"/>
                <rect x="10" y="37" width="84" height="18" rx="4" fill="#8fb587"/>
                <rect x="10" y="62" width="84" height="18" rx="4" fill="#8fb587"/>
              </g>

              <!-- Setor Sudoeste: Centro de Controle & Acesso Viário -->
              <rect x="16" y="204" width="308" height="142" rx="10" fill="#e4ebe0" stroke="#c8d4c2" stroke-width="1.5"/>
              <text x="28" y="222" fill="#4a5f48" font-size="9" font-weight="700" letter-spacing="1.2">ZONA 03 · CENTRO DE CONTROLE &amp; MOBILIDADE</text>

              <!-- Caixa Técnica Central (2x ESP32) -->
              <rect x="34" y="236" width="112" height="72" rx="7" fill="#234236" stroke="#162b22" stroke-width="1.5"/>
              <text x="46" y="254" fill="#bad6a2" font-size="8" font-weight="700">CAIXA TÉCNICA 5V</text>
              <text x="46" y="269" fill="#e8eee6" font-size="9">esp32-energy</text>
              <text x="46" y="284" fill="#b9d6df" font-size="9">esp32-water</text>

              <!-- Setor Sudeste: Estação Solar Independente (4 Postes) -->
              <rect x="386" y="204" width="338" height="142" rx="10" fill="#f3ebd6" stroke="#dfd1b0" stroke-width="1.5"/>
              <text x="400" y="222" fill="#7d6020" font-size="9" font-weight="700" letter-spacing="1.2">ZONA 04 · CIRCUITO SOLAR AUTÔNOMO (4 POSTES PV)</text>

              <!-- Ilustração dos 4 Postes Solares Independentes -->
              @for (sx of [430, 500, 570, 640]; track sx; let idx = $index) {
                <g [attr.transform]="'translate(' + sx + ', 246)'">
                  <line x1="16" y1="14" x2="16" y2="66" stroke="#6c7a69" stroke-width="3.5"/>
                  <rect x="2" y="4" width="28" height="11" rx="2" fill="#2f5673" stroke="#1d394f" stroke-width="1"/>
                  <circle cx="24" cy="22" r="5" fill="#f7d560" stroke="#b58d23" stroke-width="1"/>
                  <text x="4" y="80" fill="#6f5b2c" font-size="8" font-weight="600">PV-0{{ idx + 1 }}</text>
                </g>
              }

              <!-- Vias Principais A (Horizontal) e B (Vertical) -->
              <rect x="0" y="160" width="740" height="40" fill="#ced7cc"/>
              <rect x="330" y="0" width="50" height="360" fill="#ced7cc"/>
              <line x1="0" y1="180" x2="740" y2="180" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 8"/>
              <line x1="355" y1="0" x2="355" y2="360" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 8"/>

              <!-- Faixa de Pedestres Acessível no Cruzamento -->
              <g fill="#f7faf5" opacity="0.92">
                <rect x="312" y="163" width="12" height="5"/>
                <rect x="312" y="171" width="12" height="5"/>
                <rect x="312" y="179" width="12" height="5"/>
                <rect x="312" y="187" width="12" height="5"/>
                <rect x="335" y="203" width="6" height="12"/>
                <rect x="345" y="203" width="6" height="12"/>
                <rect x="355" y="203" width="6" height="12"/>
                <rect x="365" y="203" width="6" height="12"/>
              </g>

              <!-- Halo luminoso nos 2 Postes Principais quando mainLightOn === true -->
              @if (mainLightOn()) {
                <circle cx="118" cy="74" r="38" fill="url(#lightGlowOn)" pointer-events="none"/>
                <circle cx="245" cy="74" r="38" fill="url(#lightGlowOn)" pointer-events="none"/>
              }

              <!-- Marcadores Interativos dos Ativos (SceneAssets) -->
              @for (item of visibleSnapshots(); track item.asset.id) {
                <g class="city-asset-node"
                   role="button"
                   tabindex="0"
                   [attr.aria-label]="item.asset.displayName + ' — ' + item.primaryStateLabel"
                   [attr.aria-pressed]="selectedId() === item.asset.id"
                   [class.is-selected]="selectedId() === item.asset.id"
                   [class.is-active]="item.isActiveVisual"
                   [class.is-warning]="item.isWarningVisual"
                   [attr.transform]="'translate(' + item.asset.geometry.x + ',' + item.asset.geometry.y + ')'"
                   (click)="selectAsset(item.asset.id)"
                   (keydown.enter)="selectAsset(item.asset.id)"
                   (keydown.space)="$event.preventDefault(); selectAsset(item.asset.id)">
                  @if (selectedId() === item.asset.id) {
                    <circle r="24" fill="none" stroke="#183d32" stroke-width="2.5" stroke-dasharray="4 3"/>
                  }
                  <circle r="17"
                          [attr.fill]="nodeFill(item)"
                          [attr.stroke]="selectedId() === item.asset.id ? '#122d26' : '#ffffff'"
                          stroke-width="2.5"/>
                  <text text-anchor="middle" dy="4" fill="#ffffff" font-size="11" font-weight="700">
                    {{ nodeIcon(item.asset.kind) }}
                  </text>
                  <!-- Rótulo flutuante do ativo -->
                  <g transform="translate(0, 28)">
                    <rect x="-48" y="-9" width="96" height="17" rx="4"
                          [attr.fill]="selectedId() === item.asset.id ? '#183d32' : '#ffffff'"
                          stroke="#c8d5c8" stroke-width="1"/>
                    <text text-anchor="middle" dy="3"
                          [attr.fill]="selectedId() === item.asset.id ? '#ffffff' : '#1b3028'"
                          font-size="8.5" font-weight="700">
                      {{ item.asset.shortLabel }}
                    </text>
                  </g>
                </g>
              }
            </svg>
          </div>

          <!-- Legenda Semântica Obrigatória (Cor + Forma + Texto) -->
          <div class="city-legend-bar" aria-label="Legenda de estados da cidade">
            <span><i class="legend-swatch good"></i> Ativo / Online</span>
            <span><i class="legend-swatch sim"></i> Entrada Simulada (SIMULAÇÃO)</span>
            <span><i class="legend-swatch warn"></i> Atenção / Alerta / Bloqueio</span>
            <span><i class="legend-swatch solar"></i> Solar Autônomo (Não instrumentado)</span>
            <span><i class="legend-swatch muted"></i> Offline / Aguardando Hardware</span>
            <span class="legend-scale">Escala de referência: Maquete ~100×80 cm</span>
          </div>

          <!-- Lista Equivalente Acessível por Teclado (FE-116) -->
          <div class="city-asset-strip" role="region" aria-label="Seleção rápida de equipamentos por teclado">
            @for (item of visibleSnapshots(); track item.asset.id) {
              <button type="button"
                      class="asset-pill"
                      [class.selected]="selectedId() === item.asset.id"
                      [attr.aria-pressed]="selectedId() === item.asset.id"
                      (click)="selectAsset(item.asset.id)">
                <span class="asset-pill-icon" aria-hidden="true">{{ nodeIcon(item.asset.kind) }}</span>
                <span>{{ item.asset.shortLabel }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Drawer / Inspetor Contextual do Equipamento Selecionado -->
        @if (selected(); as current) {
          <aside class="city-inspector-drawer" aria-live="polite" aria-label="Inspetor de equipamento da cidade">
            <div class="inspector-header">
              <div>
                <span class="eyebrow">{{ current.asset.zoneName }}</span>
                <h3>{{ current.asset.displayName }}</h3>
                <code class="block-code">ID: {{ current.asset.id }}{{ current.asset.binding ? ' → ' + current.asset.binding.deviceKey + ':' + current.asset.binding.capabilityId : ' → Sem vínculo MQTT' }}</code>
              </div>
              <span class="badge"
                    [class.good]="current.connectivity === 'ONLINE'"
                    [class.sim]="current.connectivity === 'AUTONOMOUS'"
                    [class.warn]="current.connectivity === 'STALE'"
                    [class.muted]="current.connectivity === 'OFFLINE' || current.connectivity === 'UNSUPPORTED'">
                <span class="status-dot" aria-hidden="true"></span>
                {{ current.connectivityLabel }}
              </span>
            </div>

            <p class="small muted-text">{{ current.asset.subtitle }}</p>

            <!-- Proveniência: Origem, Qualidade e Timestamp -->
            <div class="inspector-meta-grid">
              <div>
                <span class="meta-label">ORIGEM DO DADO</span>
                <span class="badge" [class.sim]="current.origin === 'SIMULATED_INPUT'" [class.good]="current.origin === 'PHYSICAL_SENSOR'">
                  {{ current.originText }}
                </span>
              </div>
              <div>
                <span class="meta-label">QUALIDADE</span>
                <strong>{{ current.qualityText }}</strong>
              </div>
              <div>
                <span class="meta-label">ÚLTIMA TELEMETRIA</span>
                <strong>{{ current.lastTelemetryAt ? (current.lastTelemetryAt | date:'dd/MM HH:mm:ss') : 'Sem leitura' }}</strong>
              </div>
            </div>

            <!-- Estado Observado -->
            <div class="inspector-state-box" [class.warn]="current.isWarningVisual">
              <span class="eyebrow">ESTADO OBSERVADO NA PLATAFORMA</span>
              <strong>{{ current.primaryStateLabel }}</strong>
              <span>{{ current.secondaryMetricLabel }}</span>
            </div>

            <!-- Nota de Instrumentação e Limites Físicos -->
            <div class="inspector-note">
              <strong>Nota técnica:</strong> {{ current.asset.instrumentationNote }}
            </div>

            <!-- Controles Diretos Autorizados (HTTP 202 -> PENDING -> ACK) -->
            @if (current.asset.supportedActions.length > 0 && current.device; as dev) {
              <div class="inspector-actions-box">
                <div class="row-between">
                  <span class="eyebrow">OPERAÇÃO DIRETA (HTTP 202 → ACK)</span>
                  <span class="mode-label">Modo: {{ dev.mode ?? '—' }}</span>
                </div>

                @if (current.asset.supportedActions.includes('SET_LIGHT_MODE')) {
                  <div class="button-group">
                    <button type="button" class="button secondary"
                            [disabled]="!!store.blocked(dev, 'SET_LIGHT_MODE') || dev.mode === 'AUTO'"
                            (click)="store.send(dev, 'SET_LIGHT_MODE', { mode: 'AUTO' })">
                      Modo Automático
                    </button>
                    <button type="button" class="button secondary"
                            [disabled]="!!store.blocked(dev, 'SET_LIGHT_MODE') || dev.mode === 'MANUAL'"
                            (click)="store.send(dev, 'SET_LIGHT_MODE', { mode: 'MANUAL' })">
                      Modo Manual
                    </button>
                  </div>
                }

                @if (current.asset.supportedActions.includes('SET_LIGHT_MAIN')) {
                  <div class="button-group">
                    <button type="button" class="button primary"
                            [disabled]="!!store.blocked(dev, 'SET_LIGHT_MAIN')"
                            (click)="store.send(dev, 'SET_LIGHT_MAIN', { on: true })">
                      Ligar Ramal Principal
                    </button>
                    <button type="button" class="button secondary"
                            [disabled]="!!store.blocked(dev, 'SET_LIGHT_MAIN')"
                            (click)="store.send(dev, 'SET_LIGHT_MAIN', { on: false })">
                      Desligar Ramal
                    </button>
                  </div>
                  @if (store.blocked(dev, 'SET_LIGHT_MAIN'); as reason) {
                    <p class="small muted-text">{{ reason }}</p>
                  }
                }

                @if (current.asset.supportedActions.includes('SET_IRRIGATION_MODE')) {
                  <div class="button-group">
                    <button type="button" class="button secondary"
                            [disabled]="!!store.blocked(dev, 'SET_IRRIGATION_MODE') || dev.mode === 'AUTO'"
                            (click)="store.send(dev, 'SET_IRRIGATION_MODE', { mode: 'AUTO' })">
                      Irrigação AUTO
                    </button>
                    <button type="button" class="button secondary"
                            [disabled]="!!store.blocked(dev, 'SET_IRRIGATION_MODE') || dev.mode === 'MANUAL'"
                            (click)="store.send(dev, 'SET_IRRIGATION_MODE', { mode: 'MANUAL' })">
                      Irrigação MANUAL
                    </button>
                  </div>
                }

                @if (current.asset.supportedActions.includes('PUMP_PULSE')) {
                  <div class="button-group">
                    <button type="button" class="button primary"
                            [disabled]="!!store.blocked(dev, 'PUMP_PULSE')"
                            (click)="store.send(dev, 'PUMP_PULSE', { durationMs: 1000 })">
                      Solicitar Pulso Bomba (1000 ms)
                    </button>
                  </div>
                  @if (store.blocked(dev, 'PUMP_PULSE'); as reason) {
                    <p class="small muted-text">{{ reason }}</p>
                  }
                }

                @if (current.asset.supportedActions.includes('REQUEST_CROSSING')) {
                  <div class="button-group">
                    <button type="button" class="button primary"
                            [disabled]="!!store.blocked(dev, 'REQUEST_CROSSING')"
                            (click)="store.send(dev, 'REQUEST_CROSSING', {})">
                      Solicitar Travessia de Pedestre ⇄
                    </button>
                  </div>
                  @if (store.blocked(dev, 'REQUEST_CROSSING'); as reason) {
                    <p class="small muted-text">{{ reason }}</p>
                  }
                }
              </div>
            }

            <!-- Alertas vinculados ao ativo -->
            @if (current.activeAlerts.length > 0) {
              <div class="inspector-alerts">
                <span class="eyebrow">ALERTAS ATIVOS NESTE CONTROLADOR ({{ current.activeAlerts.length }})</span>
                @for (alert of current.activeAlerts.slice(0, 2); track alert.id) {
                  <div class="inspector-alert-row">
                    <span>! {{ cause(alert.cause) }}</span>
                    <a routerLink="/alertas" class="text-link">Tratar ↗</a>
                  </div>
                }
              </div>
            }

            <!-- Ações de Inteligência (Gemini + Melhorias + Módulo) -->
            <div class="inspector-footer-links">
              <button type="button" class="button secondary" (click)="askGeminiAbout(current)">
                ✦ Consultar Assistente IA
              </button>
              <button type="button" class="button secondary" (click)="proposeImprovement(current)">
                + Propor Melhoria
              </button>
              <a class="text-link" [routerLink]="current.asset.routePath">Abrir módulo dedicado ↗</a>
            </div>
          </aside>
        }
      </div>
    </div>
  `
})
export class CityCanvas2D {
  readonly store = inject(CityStore);
  private readonly improvements = inject(ImprovementsStore);
  private readonly router = inject(Router);

  readonly fullMode = input(false);
  readonly assetSelected = output<ResolvedAssetSnapshot>();
  readonly askAssistantRequested = output<{ assetId: string; deviceKey?: string; question: string }>();

  readonly layers = CITY_LAYERS;
  readonly activeLayer = signal<CityLayerId | 'ALL'>('ALL');
  readonly isometric3D = signal(false);
  readonly zoom = signal(1);
  readonly selectedId = signal<string>(DEFAULT_CITY_ASSETS[0].id);
  readonly cause = causeLabel;

  readonly snapshots = computed(() =>
    DEFAULT_CITY_ASSETS.map(asset => resolveAssetSnapshot(asset, this.store.devices(), this.store.alerts()))
  );

  readonly visibleSnapshots = computed(() => {
    const layer = this.activeLayer();
    return layer === 'ALL' ? this.snapshots() : this.snapshots().filter(s => s.asset.layer === layer);
  });

  readonly selected = computed(() =>
    this.snapshots().find(s => s.asset.id === this.selectedId()) ?? this.snapshots()[0]
  );

  readonly mainLightOn = computed(() => this.store.energy()?.actuators['mainLightOn'] === true);
  readonly pumpOn = computed(() => this.store.water()?.actuators['pumpOn'] === true);
  readonly reservoirLow = computed(() => this.store.water()?.measurements['reservoirLow'] !== false);

  readonly stageTransform = computed(() => {
    const z = this.zoom();
    if (this.isometric3D()) {
      return `scale(${z}) perspective(900px) rotateX(22deg) rotateZ(-4deg)`;
    }
    return z === 1 ? 'none' : `scale(${z})`;
  });

  selectAsset(id: string) {
    this.selectedId.set(id);
    const found = this.snapshots().find(s => s.asset.id === id);
    if (found) this.assetSelected.emit(found);
  }

  adjustZoom(delta: number) {
    const next = Math.min(1.45, Math.max(0.75, +(this.zoom() + delta).toFixed(2)));
    this.zoom.set(next);
  }

  nodeIcon(kind: string): string {
    return {
      LIGHT: '↯',
      SOLAR_LIGHT: '☼',
      LUX_SENSOR: '◐',
      RESERVOIR: '≈',
      PUMP: '⚙',
      GARDEN_SENSOR: '♣',
      TRAFFIC: '⇄',
      PEDESTRIAN: '♿',
      GATE: '⛨',
      CONTROL_CENTER: '▣',
      SIREN: '!'
    }[kind] ?? '•';
  }

  nodeFill(item: ResolvedAssetSnapshot): string {
    if (item.asset.kind === 'SOLAR_LIGHT') return '#b38728';
    if (item.asset.kind === 'GATE') return '#6c7a70';
    if (item.isWarningVisual) return '#b86b19';
    if (item.isActiveVisual) return '#1f6f50';
    return '#3b5c4f';
  }

  askGeminiAbout(snapshot: ResolvedAssetSnapshot) {
    const question = `Explique o estado atual de ${snapshot.asset.displayName} (${snapshot.primaryStateLabel}) e sugira hipóteses de melhoria com base nos dados disponíveis.`;
    this.askAssistantRequested.emit({
      assetId: snapshot.asset.id,
      deviceKey: snapshot.asset.binding?.deviceKey,
      question
    });
  }

  proposeImprovement(snapshot: ResolvedAssetSnapshot) {
    this.improvements.selectedAssetDraft.set({
      assetId: snapshot.asset.id,
      deviceKey: snapshot.asset.binding?.deviceKey,
      zoneId: snapshot.asset.zoneId,
      suggestionText: `Revisão operacional em ${snapshot.asset.displayName}: ${snapshot.primaryStateLabel}`
    });
    void this.router.navigate(['/melhorias']);
  }
}
