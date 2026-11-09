import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CityStore } from '../../core/city-store';
import { PageHeading } from '../../shared/page-heading';
import { DeviceStatus } from '../../shared/device-panel';
import { deviceName, originLabel, qualityLabel } from '../../core/presentation';

@Component({ imports: [PageHeading, DeviceStatus, DatePipe, RouterLink], template: `
  <cv-page-heading eyebrow="05 / DISPOSITIVOS" title="Os nós da cidade" subtitle="Conectividade, origem das leituras e versão de cada controlador." />
  <section class="panel"><div class="panel-heading"><h2>Controladores registrados</h2><div class="button-group" style="align-items:center;"><span class="badge muted">{{ store.devices().length }} dispositivos</span><a routerLink="/wifi" class="button secondary">Configurar Rede Wi-Fi das Placas</a></div></div><div class="table-scroll"><table><caption class="visually-hidden">Dispositivos registrados e estado da última telemetria</caption><thead><tr><th scope="col">Dispositivo</th><th scope="col">Comunicação</th><th scope="col">Origem / qualidade</th><th scope="col">Firmware</th><th scope="col">Último contato</th></tr></thead><tbody>@for (device of store.devices(); track device.id) { <tr><td><strong>{{ name(device.deviceKey) }}</strong><code class="block-code">{{ device.deviceKey }}</code></td><td><cv-device-status [device]="device" /><span class="cell-note">Modo: {{ device.mode ?? 'Não informado' }}</span></td><td><span class="badge" [class.sim]="device.origin === 'SIMULATED_INPUT'">{{ origin(device.origin) }}</span><span class="cell-note">{{ quality(device.quality) }}</span></td><td><code>{{ device.firmwareVersion ?? 'Não informado' }}</code></td><td><time [attr.datetime]="device.lastSeenAt" [title]="device.lastSeenAt ?? ''">{{ device.lastSeenAt ? (device.lastSeenAt | date:'dd/MM/yyyy HH:mm:ss') : 'Ainda não recebido' }}</time></td></tr> } @empty { <tr><td colspan="5" class="table-empty">{{ store.loading() ? 'Carregando dispositivos…' : 'Nenhum dispositivo disponível na última consulta.' }}</td></tr> }</tbody></table></div></section><div class="notice section-gap">Status retido ou última leitura conhecida não garantem operação atual. Observe também a qualidade, a atualização e a conexão da plataforma.</div>` })
export class Devices {
  readonly store = inject(CityStore); readonly name = deviceName; readonly origin = originLabel; readonly quality = qualityLabel;
}
