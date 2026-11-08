import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CityStore } from '../core/city-store';
import { AuthService } from '../core/auth';

@Component({ selector: 'cv-layout', imports: [RouterLink, RouterLinkActive, RouterOutlet, DatePipe], templateUrl: './layout.html', host: { '(document:keydown.escape)': 'menuOpen.set(false)' } })
export class Layout {
  readonly store = inject(CityStore); readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly menuOpen = signal(false);
  readonly nav = [
    { path: '/dashboard', label: 'Visão geral', icon: '◫', section: '01' },
    { path: '/energia', label: 'Energia', icon: '↯', section: '02' },
    { path: '/hidraulica', label: 'Hidráulica', icon: '≈', section: '03' },
    { path: '/mobilidade', label: 'Mobilidade', icon: '⇄', section: '04' },
    { path: '/dispositivos', label: 'Dispositivos', icon: '▣', section: '05' },
    { path: '/alertas', label: 'Alertas', icon: '!', section: '06' },
    { path: '/historico', label: 'Histórico', icon: '↗', section: '07' }
  ];
  readonly connectionLabel = computed(() => ({ connected: 'Tempo real conectado', connecting: 'Conectando…', reconnecting: 'Reconectando…', offline: 'Tempo real desconectado' }[this.store.live.status()]));
  constructor() { inject(Router).events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => this.menuOpen.set(false)); }
}
