import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CityStore } from '../../core/city-store';
import { PageHeading } from '../../shared/page-heading';
import { CityAlert } from '../../core/models';
import { causeLabel, deviceName } from '../../core/presentation';

@Component({ imports: [PageHeading, DatePipe], template: `
  <cv-page-heading eyebrow="06 / ALERTAS" title="Atenção ao que importa" subtitle="Reconhecer uma ocorrência não apaga sua causa." />
  <section class="panel"><div class="panel-heading"><h2>Ocorrências do laboratório</h2><div class="segmented" aria-label="Filtrar ocorrências"><button [class.selected]="!showAll()" [attr.aria-pressed]="!showAll()" (click)="showAll.set(false)">Ativas ({{ store.activeAlerts().length }})</button><button [class.selected]="showAll()" [attr.aria-pressed]="showAll()" (click)="showAll.set(true)">Mais recentes</button></div></div>
    <div class="alert-list">@for (alert of items(); track alert.id) { <article class="alert-item"><span class="alert-symbol" [class.resolved]="!alert.active" aria-hidden="true">{{ alert.active ? '!' : '✓' }}</span><div class="alert-content"><div class="row-between"><h3>{{ cause(alert.cause) }}</h3><span class="badge" [class.warn]="alert.active" [class.muted]="!alert.active">{{ alert.active ? 'Causa ativa' : 'Causa encerrada' }}</span></div><p>{{ name(alert.deviceKey) }} <span class="small muted-text">/ {{ alert.deviceKey }}</span></p><p class="small muted-text"><time [title]="alert.raisedAt">{{ alert.raisedAt | date:'dd/MM/yyyy HH:mm:ss' }}</time></p>@if (alert.acknowledgedAt) { <p class="acknowledged">Reconhecido em {{ alert.acknowledgedAt | date:'dd/MM, HH:mm:ss' }}{{ alert.active ? ' · a causa continua ativa' : '' }}</p> } @else { <button class="button secondary" [disabled]="!store.auth.operator() || acknowledging().includes(alert.id) || !!store.error()" (click)="acknowledge(alert)">{{ acknowledging().includes(alert.id) ? 'Reconhecendo…' : 'Reconhecer ocorrência' }}</button> }</div></article> } @empty { <div class="empty-state"><span aria-hidden="true">✓</span><h3>{{ store.loading() ? 'Consultando ocorrências…' : 'Nenhuma ocorrência neste filtro' }}</h3><p>Conforme a última consulta à plataforma.</p></div> }</div>
    @if (!store.auth.operator()) { <p class="panel-bottom-note">Perfil de consulta. Somente operadores podem reconhecer ocorrências.</p> }
  </section>` })
export class Alerts {
  readonly store = inject(CityStore); readonly showAll = signal(false); readonly acknowledging = signal<string[]>([]);
  readonly items = computed(() => this.showAll() ? this.store.alerts() : this.store.activeAlerts());
  readonly cause = causeLabel; readonly name = deviceName;
  async acknowledge(alert: CityAlert) {
    if (this.acknowledging().includes(alert.id)) return;
    this.acknowledging.update(ids => [...ids, alert.id]);
    try { await this.store.acknowledge(alert); } finally { this.acknowledging.update(ids => ids.filter(id => id !== alert.id)); }
  }
}
