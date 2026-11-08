import { Component, inject, input } from '@angular/core';
import { CityStore } from '../core/city-store';

@Component({ selector: 'cv-page-heading', template: `
  <header class="page-heading"><div><span class="eyebrow">{{ eyebrow() }}</span><h1>{{ title() }}</h1><p>{{ subtitle() }}</p></div><div class="page-heading-actions">@if (store.simulated()) { <span class="badge sim">SIMULAÇÃO ATIVA</span> }<button type="button" class="button secondary" (click)="store.refresh()" [disabled]="store.refreshing()"><span aria-hidden="true">↻</span>{{ store.refreshing() ? 'Atualizando…' : 'Atualizar' }}</button></div></header>
  @if (store.loading()) { <div class="loading-line" role="status">Carregando dados da cidade…</div> }
` })
export class PageHeading {
  readonly store = inject(CityStore); readonly eyebrow = input('CIDADE VIVA');
  readonly title = input.required<string>(); readonly subtitle = input('');
}
