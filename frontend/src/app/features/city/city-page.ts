import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DEFAULT_CITY_ASSETS, resolveAssetSnapshot, ResolvedAssetSnapshot } from '../../core/city-scene';
import { CityStore } from '../../core/city-store';
import { CityCanvas2D } from '../../shared/city-canvas-2d';
import { CommandList } from '../../shared/command-list';
import { PageHeading } from '../../shared/page-heading';
import { CityAssistant } from '../dashboard/city-assistant';

@Component({
  selector: 'app-city-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeading, CityCanvas2D, CommandList, CityAssistant],
  template: `
    <cv-page-heading
      eyebrow="02 / GÊMEO VISUAL INTERATIVO (SDD 002 · FE-104 & FE-105)"
      title="Cidade Interativa 2D & Projeção Isométrica"
      subtitle="Inspeção por equipamento, camadas temáticas, vínculos canônicos asset→capability→device e atuação com ACK." />

    <section class="panel section-gap">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">PLANTA COORDENADA DA MAQUETE (~100×80 CM)</span>
          <h2>Explore ativos, sensores e atuadores</h2>
        </div>
        <span class="badge" [class.sim]="store.simulated()" [class.good]="!store.simulated()">
          {{ store.simulated() ? 'Ambiente com dados de SIMULAÇÃO' : 'Monitoramento de Laboratório' }}
        </span>
      </div>
      <div class="module-body">
        <cv-city-canvas-2d
          [fullMode]="true"
          (assetSelected)="selectedSnapshot.set($event)"
          (askAssistantRequested)="onAskAssistant($event)" />
      </div>
    </section>

    <!-- Equivalente Tabular Acessível Completo (FE-116 / Critério Global #1 e #10) -->
    <section class="panel section-gap">
      <div class="panel-heading">
        <div>
          <span class="eyebrow">MATRIZ DE VÍNCULOS CANÔNICOS (ASSET BINDINGS)</span>
          <h2>Inventário de ativos da cena ({{ allSnapshots().length }} elementos)</h2>
        </div>
        <a routerLink="/dispositivos" class="text-link">Ver controladores ESP32 ↗</a>
      </div>
      <div class="table-scroll">
        <table>
          <caption class="visually-hidden">Tabela acessível de todos os ativos da cidade 2D e seus vínculos de hardware</caption>
          <thead>
            <tr>
              <th scope="col">Ativo / ID Canônico</th>
              <th scope="col">Zona / Camada</th>
              <th scope="col">Vínculo (Device : Capability)</th>
              <th scope="col">Estado Observado</th>
              <th scope="col">Origem / Qualidade</th>
              <th scope="col">Ações Suportadas</th>
            </tr>
          </thead>
          <tbody>
            @for (item of allSnapshots(); track item.asset.id) {
              <tr>
                <td>
                  <strong>{{ item.asset.displayName }}</strong>
                  <code class="block-code">{{ item.asset.id }}</code>
                </td>
                <td>
                  <span>{{ item.asset.zoneName }}</span>
                  <span class="cell-note">Camada: {{ item.asset.layer }}</span>
                </td>
                <td>
                  @if (item.asset.binding; as b) {
                    <code>{{ b.deviceKey }} : {{ b.capabilityId }}</code>
                  } @else {
                    <span class="badge muted">Sem vínculo MQTT</span>
                  }
                </td>
                <td>
                  <strong>{{ item.primaryStateLabel }}</strong>
                  <span class="cell-note">{{ item.secondaryMetricLabel }}</span>
                </td>
                <td>
                  <span class="badge" [class.sim]="item.origin === 'SIMULATED_INPUT'">{{ item.originText }}</span>
                  <span class="cell-note">{{ item.qualityText }} · {{ item.lastTelemetryAt ? (item.lastTelemetryAt | date:'dd/MM HH:mm:ss') : 'sem leitura' }}</span>
                </td>
                <td>
                  @if (item.asset.supportedActions.length) {
                    <code>{{ item.asset.supportedActions.join(', ') }}</code>
                  } @else {
                    <span class="small muted-text">Somente inspeção</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <div class="dashboard-grid section-gap">
      <cv-city-assistant
        [deviceKey]="selectedSnapshot()?.asset?.binding?.deviceKey"
        [assetLabel]="selectedSnapshot()?.asset?.displayName"
        [presetQuestion]="assistantQuestion()" />
      <section class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">AUDITORIA DE COMANDOS</span>
            <h2>Comandos disparados na sessão</h2>
          </div>
          <a routerLink="/historico" class="text-link">Histórico completo ↗</a>
        </div>
        <cv-command-list />
      </section>
    </div>
  `
})
export class CityPage {
  readonly store = inject(CityStore);
  readonly allSnapshots = computed(() =>
    DEFAULT_CITY_ASSETS.map(a => resolveAssetSnapshot(a, this.store.devices(), this.store.alerts()))
  );
  readonly selectedSnapshot = signal<ResolvedAssetSnapshot | null>(null);
  readonly assistantQuestion = signal('');

  onAskAssistant(payload: { assetId: string; deviceKey?: string; question: string }) {
    this.assistantQuestion.set(payload.question);
  }
}
