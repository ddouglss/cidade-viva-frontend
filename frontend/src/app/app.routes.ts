import { Routes } from '@angular/router';
import { authenticatedGuard } from './core/auth';
import { Layout } from './shared/layout';

export const routes: Routes = [
  { path: 'login', title: 'Entrar · Cidade Viva', loadComponent: () => import('./features/login/login').then(m => m.Login) },
  { path: '', component: Layout, canActivate: [authenticatedGuard], children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', title: 'Visão geral · Cidade Viva', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    { path: 'energia', title: 'Energia · Cidade Viva', loadComponent: () => import('./features/energy/energy').then(m => m.Energy) },
    { path: 'hidraulica', title: 'Hidráulica · Cidade Viva', loadComponent: () => import('./features/water/water').then(m => m.Water) },
    { path: 'mobilidade', title: 'Mobilidade · Cidade Viva', loadComponent: () => import('./features/mobility/mobility').then(m => m.Mobility) },
    { path: 'dispositivos', title: 'Dispositivos · Cidade Viva', loadComponent: () => import('./features/devices/devices').then(m => m.Devices) },
    { path: 'alertas', title: 'Alertas · Cidade Viva', loadComponent: () => import('./features/alerts/alerts').then(m => m.Alerts) },
    { path: 'historico', title: 'Histórico · Cidade Viva', loadComponent: () => import('./features/history/history').then(m => m.History) }
  ] },
  { path: '**', redirectTo: 'dashboard' }
];
