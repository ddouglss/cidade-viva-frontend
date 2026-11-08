import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AccessToken, CityAlert, Command, Device, Identity, Page, Reading } from './models';

export const API_BASE = new InjectionToken<string>('API_BASE', { providedIn: 'root', factory: () =>
  (document.querySelector('meta[name="api-base-url"]')?.getAttribute('content') ?? '').replace(/\/$/, '') });

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
  login(username: string, password: string) { return firstValueFrom(this.http.post<AccessToken>(this.base + '/auth/login', { username, password })); }
  me() { return firstValueFrom(this.http.get<Identity>(this.base + '/auth/me')); }
  devices() { return firstValueFrom(this.http.get<Device[]>(this.base + '/devices')); }
  alerts() { return firstValueFrom(this.http.get<CityAlert[]>(this.base + '/alerts')); }
  command(id: string) { return firstValueFrom(this.http.get<Command>(`${this.base}/commands/${encodeURIComponent(id)}`)); }
  requestCommand(deviceKey: string, commandId: string, action: string, parameters: Record<string, unknown>) {
    return firstValueFrom(this.http.post<Command>(`${this.base}/devices/${encodeURIComponent(deviceKey)}/commands`, { commandId, action, parameters }));
  }
  acknowledge(id: string) { return firstValueFrom(this.http.post<CityAlert>(`${this.base}/alerts/${encodeURIComponent(id)}/ack`, {})); }
  readings(key: string, filters: { page: number; metric?: string; from?: string; to?: string }) {
    let params = new HttpParams().set('page', filters.page).set('pageSize', 20);
    for (const name of ['metric', 'from', 'to'] as const) if (filters[name]) params = params.set(name, filters[name]!);
    return firstValueFrom(this.http.get<Page<Reading>>(`${this.base}/devices/${encodeURIComponent(key)}/telemetry`, { params }));
  }
}
