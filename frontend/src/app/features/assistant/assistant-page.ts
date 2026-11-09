import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_CITY_ASSETS } from '../../core/city-scene';
import { CityStore } from '../../core/city-store';
import { PageHeading } from '../../shared/page-heading';
import { CityAssistant } from '../dashboard/city-assistant';

@Component({
  selector: 'app-assistant-page',
  standalone: true,
  imports: [RouterLink, PageHeading, CityAssistant],
  template: `
    <cv-page-heading
      eyebrow="10 / ASSISTENTE CIDADE VIVA · GEMINI READ-ONLY (SEÇÃO 13)"
      title="Assistente Inteligente & Base de Conhecimento"
      subtitle="Consultas contextualizadas por equipamento, análise de incidentes e geração de rascunhos de melhoria sem acesso direto ao MQTT." />

    <div class="content-columns">
      <div>
        <!-- Seletor de Contexto por Ativo da Cidade -->
        <section class="panel" style="margin-bottom: 22px;">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">ESCOPO DA CONSULTA</span>
              <h2>Selecione o ativo ou controlador de contexto</h2>
            </div>
          </div>
          <div class="module-body">
            <div class="city-asset-strip">
              <button type="button" class="asset-pill" [class.selected]="!selectedAssetId()" (click)="selectScope('', 'Visão global da cidade', undefined)">
                Visão Global (Todos os dispositivos)
              </button>
              @for (asset of assets; track asset.id) {
                <button type="button" class="asset-pill" [class.selected]="selectedAssetId() === asset.id"
                        (click)="selectScope(asset.id, asset.displayName, asset.binding?.deviceKey)">
                  {{ asset.shortLabel }}
                </button>
              }
            </div>
          </div>
        </section>

        <cv-city-assistant
          [deviceKey]="selectedDeviceKey()"
          [assetLabel]="selectedLabel()"
          [presetQuestion]="presetQuestion()" />
      </div>

      <!-- Capacidades e Guardrails de Segurança (Seção 13.2 e 13.5 do SDD v1.2) -->
      <aside class="dashboard-side-stack">
        <section class="panel info-panel">
          <span class="eyebrow">CAPACIDADES DO ASSISTENTE (SDD v1.2)</span>
          <h2>Modos de operação</h2>
          <ul class="plain-list">
            <li><strong>AI-READ:</strong> Explica o que está ligado, estado dos reservatórios, origem (<code>PHYSICAL_SENSOR</code> vs <code>SIMULATED_INPUT</code>) e qualidade das leituras.</li>
            <li><strong>AI-ANALYZE:</strong> Resume alertas ativos, motivos de bloqueio (<code>RESERVOIR_LOW</code>) e padrões de operação.</li>
            <li><strong>AI-IMPROVE:</strong> Gera sugestões estruturadas que podem ser salvas como rascunho (<code>IDEA</code>) no módulo <a routerLink="/melhorias" class="text-link">Gestão de Melhorias</a> após confirmação humana.</li>
            <li><strong>AI-HELP:</strong> Responde dúvidas sobre os contratos MQTT v1.0, arquitetura .NET/SignalR e proteções locais dos ESP32.</li>
          </ul>
        </section>

        <section class="panel info-panel">
          <span class="eyebrow">GOVERNANÇA &amp; SEGURANÇA (AI-002 / AI-005)</span>
          <h2>Isolamento de comandos físicos</h2>
          <p>A chave <code>Gemini__ApiKey</code> reside exclusivamente no servidor ASP.NET Core. O modelo recebe apenas projeções de leitura autorizadas e <strong>não possui ferramenta de publicação MQTT</strong>.</p>
          <div class="button-group section-gap">
            <button type="button" class="button secondary" (click)="presetQuestion.set('Como funcionam os contratos MQTT e o fluxo HTTP 202 -> ACK na Cidade Viva?')">
              Perguntar sobre arquitetura MQTT
            </button>
            <button type="button" class="button secondary" (click)="presetQuestion.set('Analise os alertas ativos e proponha um plano de validação para reduzir ocorrências.')">
              Analisar alertas e sugerir melhoria
            </button>
          </div>
        </section>
      </aside>
    </div>
  `
})
export class AssistantPage {
  readonly store = inject(CityStore);
  readonly assets = DEFAULT_CITY_ASSETS;

  readonly selectedAssetId = signal('');
  readonly selectedLabel = signal('Visão global da cidade');
  readonly selectedDeviceKey = signal<string | undefined>(undefined);
  readonly presetQuestion = signal('');

  selectScope(id: string, label: string, deviceKey?: string) {
    this.selectedAssetId.set(id);
    this.selectedLabel.set(label);
    this.selectedDeviceKey.set(deviceKey);
  }
}
