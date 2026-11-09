import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CityStore } from '../core/city-store';
import { AuthService } from '../core/auth';
import { ImprovementsStore } from '../core/improvements-store';

export interface NavGroup {
  caption: string;
  items: Array<{ path: string; label: string; icon: string; section: string }>;
}

@Component({
  selector: 'cv-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, DatePipe],
  templateUrl: './layout.html',
  host: { '(document:keydown.escape)': 'menuOpen.set(false)' }
})
export class Layout {
  readonly store = inject(CityStore);
  readonly auth = inject(AuthService);
  readonly improvements = inject(ImprovementsStore);
  readonly router = inject(Router);
  readonly menuOpen = signal(false);

  readonly navGroups: NavGroup[] = [
    {
      caption: 'VISÃO GERAL',
      items: [
        { path: '/dashboard', label: 'Centro de operações', icon: '◫', section: '01' },
        { path: '/cidade', label: 'Cidade interativa 2D/3D', icon: '⌖', section: '02' },
        { path: '/apresentacao', label: 'Modo apresentação', icon: '▣', section: '03' }
      ]
    },
    {
      caption: 'OPERAÇÕES',
      items: [
        { path: '/energia', label: 'Energia & Solar', icon: '↯', section: '04' },
        { path: '/hidraulica', label: 'Hidráulica & Horta', icon: '≈', section: '05' },
        { path: '/mobilidade', label: 'Mobilidade & Travessia', icon: '⇄', section: '06' },
        { path: '/alertas', label: 'Centro de alertas', icon: '!', section: '07' }
      ]
    },
    {
      caption: 'INTELIGÊNCIA & MELHORIA',
      items: [
        { path: '/analises', label: 'Análises & Relatórios', icon: '↗', section: '08' },
        { path: '/melhorias', label: 'Gestão de melhorias', icon: '✦', section: '09' },
        { path: '/assistente', label: 'Assistente Gemini', icon: '◈', section: '10' },
        { path: '/automacoes', label: 'Automações & Regras', icon: '⚙', section: '11' }
      ]
    },
    {
      caption: 'GESTÃO & OBSERVABILIDADE',
      items: [
        { path: '/dispositivos', label: 'Dispositivos ESP32', icon: '▣', section: '12' },
        { path: '/wifi', label: 'Conexão Wi-Fi Placas', icon: '≋', section: '13' },
        { path: '/historico', label: 'Histórico & Auditoria', icon: '☰', section: '14' }
      ]
    }
  ];

  // Mantém compatibilidade com referências planas caso algum teste consulte layout.nav
  readonly nav = this.navGroups.flatMap(g => g.items);

  readonly connectionLabel = computed(() => ({
    connected: 'SignalR conectado',
    connecting: 'Conectando…',
    reconnecting: 'Reconectando…',
    offline: 'SignalR desconectado'
  }[this.store.live.status()]));

  readonly environmentMode = computed(() =>
    this.store.simulated() ? 'SIMULATION' : 'LAB'
  );

  constructor() {
    inject(Router).events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuOpen.set(false));
  }
}
