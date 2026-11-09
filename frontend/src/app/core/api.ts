import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AccessToken, AutomationRule, CityAlert, Command, Device, Identity, Page, Reading, WifiConnectRequest, WifiConnectResult, WifiProvisionOverview } from './models';

export const API_BASE = new InjectionToken<string>('API_BASE', { providedIn: 'root', factory: () =>
  (document.querySelector('meta[name="api-base-url"]')?.getAttribute('content') ?? '').replace(/\/$/, '') });

export interface AssistantAnswer {
  answer: string;
  contextAt: string;
  sources: Array<Pick<Device, 'deviceKey' | 'origin' | 'quality' | 'lastTelemetryAt' | 'isStale'>>;
}

export function friendlyError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Não foi possível concluir. Tente novamente.';
  switch (error.status) {
    case 0: return 'Sem conexão com a plataforma. Verifique se a API está disponível.';
    case 401: return 'Acesso não autorizado. Confira as credenciais ou entre novamente.';
    case 403: return 'Seu perfil permite apenas consultas.';
    case 404: return 'Registro não encontrado.';
    case 409: return 'Os dados mudaram. Atualize a consulta antes de continuar.';
    case 429: return 'Muitas solicitações. Aguarde um minuto e tente novamente.';
    case 400: return 'Solicitação inválida. Confira os valores e limites permitidos.';
    default: return 'A plataforma está indisponível no momento. Os dados exibidos são da última consulta.';
  }
}

@Injectable({ providedIn: 'root' })
export class CityApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE) + '/api/v1';
  private readonly timeout = 10_000;
  login(username: string, password: string) { return firstValueFrom(this.http.post<AccessToken>(this.base + '/auth/login', { username, password })); }
  me() { return firstValueFrom(this.http.get<Identity>(this.base + '/auth/me')); }
  assistantAvailability() { return firstValueFrom(this.http.get<{ available: boolean }>(this.base + '/ai/availability', { timeout: this.timeout })); }
  askAssistant(question: string, deviceKey?: string) {
    return firstValueFrom(this.http.post<AssistantAnswer>(this.base + '/ai/chat', { question, deviceKey }, { timeout: 25_000 }));
  }
  devices() { return firstValueFrom(this.http.get<Device[]>(this.base + '/devices', { timeout: this.timeout })); }
  alerts() { return firstValueFrom(this.http.get<CityAlert[]>(this.base + '/alerts', { timeout: this.timeout })); }
  command(id: string) { return firstValueFrom(this.http.get<Command>(`${this.base}/commands/${encodeURIComponent(id)}`, { timeout: this.timeout })); }
  requestCommand(deviceKey: string, commandId: string, action: string, parameters: Record<string, unknown>) {
    return firstValueFrom(this.http.post<Command>(`${this.base}/devices/${encodeURIComponent(deviceKey)}/commands`, { commandId, action, parameters }, { timeout: this.timeout }));
  }
  acknowledge(id: string) { return firstValueFrom(this.http.post<CityAlert>(`${this.base}/alerts/${encodeURIComponent(id)}/ack`, {})); }
  updateRule(id: string, maxPulseMs: number, cooldownMs: number, expectedVersion: number) {
    return firstValueFrom(this.http.put<AutomationRule>(`${this.base}/automation-rules/${encodeURIComponent(id)}`, { maxPulseMs, cooldownMs, expectedVersion }, { timeout: this.timeout }));
  }
  readings(key: string, filters: { page: number; pageSize?: number; metric?: string; from?: string; to?: string }) {
    let params = new HttpParams().set('page', filters.page).set('pageSize', filters.pageSize ?? 20);
    for (const name of ['metric', 'from', 'to'] as const) if (filters[name]) params = params.set(name, filters[name]!);
    return firstValueFrom(this.http.get<Page<Reading>>(`${this.base}/devices/${encodeURIComponent(key)}/telemetry`, { params, timeout: this.timeout }));
  }
  scanWifi(options?: { port?: string; host?: string }) {
    let params = new HttpParams();
    if (options?.port) params = params.set('port', options.port);
    if (options?.host) params = params.set('host', options.host);
    return firstValueFrom(this.http.get<WifiProvisionOverview>(`${this.base}/wifi/scan`, { params, timeout: 20_000 }));
  }
  connectWifi(request: WifiConnectRequest) {
    return firstValueFrom(this.http.post<WifiConnectResult>(`${this.base}/wifi/connect`, request, { timeout: 45_000 }));
  }
  scanBoardHttpDirect(host: string) {
    return firstValueFrom(this.http.get<{ deviceId: string; networks: Array<{ ssid: string; rssi: number; channel: number; auth: string }> }>(`http://${host}/api/wifi/scan`, { timeout: 10_000 }));
  }
  connectBoardHttpDirect(host: string, ssid: string, password?: string) {
    return firstValueFrom(this.http.post<{ deviceId: string; phase: string; connected: boolean; ip: string }>(`http://${host}/api/wifi/connect`, { ssid, password: password ?? '' }, { timeout: 15_000 }));
  }
}
