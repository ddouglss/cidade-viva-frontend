import { Routes } from '@angular/router';
import { authenticatedGuard } from './core/auth';
import { Layout } from './shared/layout';

export const routes: Routes = [
  { path: 'login', title: 'Entrar · Cidade Viva', loadComponent: () => import('./features/login/login').then(m => m.Login) },
  { path: '', component: Layout, canActivate: [authenticatedGuard], children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', title: 'Centro de Operações · Cidade Viva', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    { path: 'cidade', title: 'Cidade Interativa 2D/3D · Cidade Viva', loadComponent: () => import('./features/city/city-page').then(m => m.CityPage) },
    { path: 'apresentacao', title: 'Modo Apresentação · Cidade Viva', loadComponent: () => import('./features/presentation/presentation-page').then(m => m.PresentationPage) },
    { path: 'energia', title: 'Energia & Solar · Cidade Viva', loadComponent: () => import('./features/energy/energy').then(m => m.Energy) },
    { path: 'hidraulica', title: 'Hidráulica & Horta · Cidade Viva', loadComponent: () => import('./features/water/water').then(m => m.Water) },
    { path: 'mobilidade', title: 'Mobilidade & Travessia · Cidade Viva', loadComponent: () => import('./features/mobility/mobility').then(m => m.Mobility) },
    { path: 'alertas', title: 'Centro de Alertas · Cidade Viva', loadComponent: () => import('./features/alerts/alerts').then(m => m.Alerts) },
    { path: 'analises', title: 'Análises & Relatórios · Cidade Viva', loadComponent: () => import('./features/analytics/analytics').then(m => m.Analytics) },
    { path: 'melhorias', title: 'Gestão de Melhorias · Cidade Viva', loadComponent: () => import('./features/improvements/improvements').then(m => m.Improvements) },
    { path: 'assistente', title: 'Assistente Gemini · Cidade Viva', loadComponent: () => import('./features/assistant/assistant-page').then(m => m.AssistantPage) },
    { path: 'automacoes', title: 'Automações & Regras · Cidade Viva', loadComponent: () => import('./features/automations/automations').then(m => m.Automations) },
    { path: 'dispositivos', title: 'Dispositivos ESP32 · Cidade Viva', loadComponent: () => import('./features/devices/devices').then(m => m.Devices) },
    { path: 'wifi', title: 'Conexão Wi-Fi Placas · Cidade Viva', loadComponent: () => import('./features/wifi/wifi').then(m => m.WifiSetup) },
    { path: 'historico', title: 'Histórico & Auditoria · Cidade Viva', loadComponent: () => import('./features/history/history').then(m => m.History) }
  ] },
  { path: '**', redirectTo: 'dashboard' }
];
