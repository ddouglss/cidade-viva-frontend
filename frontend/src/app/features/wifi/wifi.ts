import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CityApi, friendlyError } from '../../core/api';
import { CityStore } from '../../core/city-store';
import { Esp32PortStatus, WifiConnectResult, WifiNetwork } from '../../core/models';
import { deviceName } from '../../core/presentation';
import { PageHeading } from '../../shared/page-heading';

@Component({
  imports: [PageHeading, DatePipe, FormsModule],
  template: `
    <cv-page-heading
      eyebrow="13 / REDE WI-FI DAS PLACAS"
      title="Conexão Wi-Fi das placas ESP32"
      subtitle="Configure a rede das placas instaladas e acompanhe a reconexão no painel de dispositivos."
    />

    @if (isHosted) {
      <section class="panel" aria-labelledby="wifi-local-title">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">CONFIGURAÇÃO NA MAQUETE</span>
            <h2 id="wifi-local-title">Trocar o Wi-Fi sem retirar a placa</h2>
          </div>
        </div>
        <div class="control-section">
          <ol class="plain-list">
            <li>Quando a placa perder o Wi-Fi por cerca de 30 segundos, conecte o notebook ou celular à rede <strong>CidadeViva-Energy</strong> ou <strong>CidadeViva-Water</strong> usando a senha própria da placa registrada na instalação.</li>
            <li>Abra o portal local e informe o novo Wi-Fi de 2,4 GHz, a senha da rede e o IP privado do notebook que executa a ponte MQTT.</li>
            <li>Após salvar, reconecte seu notebook à rede normal e confira o estado em <a href="/dispositivos">Dispositivos ESP32</a>.</li>
          </ol>
          <a class="button primary" href="http://192.168.4.1/" target="_blank" rel="noopener noreferrer">Abrir portal local da placa</a>
          <p class="control-help">O portal só abre enquanto você estiver conectado à rede da placa. Em redes com isolamento de dispositivos, use um hotspot 2,4 GHz próprio para a demonstração.</p>
        </div>
      </section>
    } @else {
    <div class="overview-stats">
      <div class="stat">
        <span class="stat-label">REDE DO NOTEBOOK</span>
        <div>
          <strong class="stat-word">{{ notebookSsid() || 'Não identificada' }}</strong>
          <span class="stat-icon">≋</span>
        </div>
        <p>
          @if (notebookBand()) {
            Banda: {{ notebookBand() }} · Sinal: {{ notebookSignal() ?? '--' }}%
          } @else {
            Conecte as placas na mesma rede 2,4 GHz do notebook
          }
        </p>
      </div>

      <div class="stat">
        <span class="stat-label">REDES 2,4 GHZ VISÍVEIS</span>
        <div>
          <strong>{{ compatibleNetworksCount() }}</strong>
          <span class="stat-total">/ {{ networks().length }}</span>
          <span class="stat-icon energy">↯</span>
        </div>
        <p>O ESP32 opera exclusivamente em redes Wi-Fi de 2,4 GHz</p>
      </div>

      <div class="stat">
        <span class="stat-label">PLACAS DETECTADAS</span>
        <div>
          <strong>{{ detectedBoards().length }}</strong>
          <span class="stat-icon amber">▣</span>
        </div>
        <p>
          @if (detectedBoards().length) {
            {{ detectedBoardsSummary() }}
          } @else {
            Via Porta COM (ex: COM5) ou Rede AP da Placa (192.168.4.1)
          }
        </p>
      </div>
    </div>

    @if (connectResult(); as result) {
      <div class="notice section-gap" [class.error]="!result.connected" role="status" style="margin-bottom: 22px;">
        <div>
          <strong>{{ result.connected ? 'Placa conectada com sucesso!' : 'Falha na conexão Wi-Fi' }}</strong>
          <p class="small" style="margin-top: 4px;">{{ result.message }}</p>
          @if (result.ip) {
            <code class="block-code">IP da Placa na rede: {{ result.ip }} · Rede: {{ result.ssid }} · Alvo: {{ result.target }}</code>
          }
        </div>
        <button type="button" class="text-button" (click)="connectResult.set(null)">Fechar</button>
      </div>
    }

    @if (scanError()) {
      <div class="notice error" role="alert">
        <span>{{ scanError() }}</span>
        <button type="button" class="text-button" (click)="scanNetworks()">Tentar novamente</button>
      </div>
    }

    <div class="content-columns">
      <div>
        <section class="panel">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">ESCANEAR AMBIENTE</span>
              <h2>Redes Wi-Fi disponíveis</h2>
            </div>
            <div class="button-group">
              <button type="button" class="button secondary" [disabled]="scanning() || connecting()" (click)="scanNetworks()">
                {{ scanning() ? 'Escaneando redes…' : '↻ Atualizar redes Wi-Fi' }}
              </button>
            </div>
          </div>

          <div class="table-scroll">
            <table>
              <caption class="visually-hidden">Lista de redes Wi-Fi disponíveis para conexão dos ESP32</caption>
              <thead>
                <tr>
                  <th scope="col">Rede (SSID)</th>
                  <th scope="col">Banda / Canal</th>
                  <th scope="col">Sinal</th>
                  <th scope="col">Segurança / Origem</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                @for (net of networks(); track net.ssid) {
                  <tr [style.background]="selectedSsid() === net.ssid ? '#f0f6f1' : ''">
                    <td>
                      <strong>{{ net.ssid }}</strong>
                      @if (net.isCurrentNotebookNetwork) {
                        <span class="badge good" style="margin-top: 5px;">● Mesma rede do notebook</span>
                      }
                    </td>
                    <td>
                      <span class="badge" [class.good]="net.band === '2,4 GHz'" [class.warn]="net.band === '5 GHz'">
                        {{ net.band }}
                      </span>
                      <span class="cell-note">Canal {{ net.channel }}</span>
                    </td>
                    <td>
                      <strong>{{ net.signalPercent }}%</strong>
                      <span class="cell-note">{{ net.rssi }} dBm</span>
                    </td>
                    <td>
                      <span class="badge muted">{{ net.auth }}</span>
                      <span class="cell-note">{{ net.source }}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="button"
                        [class.primary]="selectedSsid() === net.ssid"
                        [class.secondary]="selectedSsid() !== net.ssid"
                        (click)="selectNetwork(net)"
                      >
                        {{ selectedSsid() === net.ssid ? 'Selecionada' : 'Selecionar' }}
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="table-empty">
                      {{ scanning() ? 'Buscando redes Wi-Fi do ambiente e das placas…' : 'Nenhuma rede encontrada. Clique em Atualizar redes Wi-Fi ou digite o nome manualmente ao lado.' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (scannedAt()) {
            <div class="panel-bottom-note">
              Última varredura realizada às {{ scannedAt() | date:'HH:mm:ss' }}. Clique em uma rede 2,4 GHz acima para preencher a conexão ao lado.
            </div>
          }
        </section>

        <section class="panel section-gap">
          <div class="panel-heading">
            <div>
              <span class="eyebrow">ESTADO DOS CONTROLADORES</span>
              <h2>Placas ESP32 detectadas</h2>
            </div>
            <span class="badge muted">{{ detectedBoards().length }} encontradas</span>
          </div>
          <div class="table-scroll">
            <table>
              <caption class="visually-hidden">Placas ESP32 detectadas via porta serial ou rede local</caption>
              <thead>
                <tr>
                  <th scope="col">Placa / Dispositivo</th>
                  <th scope="col">Canal de Comunicação</th>
                  <th scope="col">Estado Wi-Fi</th>
                  <th scope="col">Endereço IP</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>
              <tbody>
                @for (board of detectedBoards(); track board.port) {
                  <tr>
                    <td>
                      <strong>{{ name(board.deviceId) }}</strong>
                      <code class="block-code">{{ board.deviceId }}</code>
                    </td>
                    <td>
                      <span class="badge pending">{{ board.transport === 'USB_SERIAL' ? 'USB (' + board.port + ')' : 'Wi-Fi HTTP (' + board.port + ')' }}</span>
                    </td>
                    <td>
                      <span class="badge" [class.good]="board.connected" [class.warn]="!board.connected">
                        {{ board.connected ? 'CONECTADO (' + (board.ssid || 'Wi-Fi') + ')' : board.phase }}
                      </span>
                    </td>
                    <td>
                      <code>{{ board.ip }}</code>
                    </td>
                    <td>
                      <button type="button" class="button secondary" (click)="selectBoard(board)">
                        Usar alvo
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="table-empty">
                      Nenhuma placa respondeu automaticamente na varredura rápida. Você pode informar a porta (ex: COM5) ou IP da placa (ex: 192.168.4.1) no painel ao lado.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">CONFIGURAR CONEXÃO</span>
            <h2>Conectar ESP32 à rede</h2>
          </div>
        </div>

        <form class="control-section" style="border-top: 0; padding-top: 4px;" (ngSubmit)="connectBoard()">
          <div class="field" style="margin-bottom: 16px;">
            <label for="target-device">Controlador alvo</label>
            <select id="target-device" name="deviceKey" [ngModel]="targetDeviceKey()" (ngModelChange)="targetDeviceKey.set($event)">
              <option value="esp32-energy">Energia e mobilidade (esp32-energy)</option>
              <option value="esp32-water">Hidráulica e irrigação (esp32-water)</option>
            </select>
          </div>

          <div class="field" style="margin-bottom: 16px;">
            <label for="connection-mode">Modo de envio para a placa</label>
            <select id="connection-mode" name="mode" [ngModel]="connectionMode()" (ngModelChange)="onModeChange($event)">
              <option value="AUTO">Automático (COM5 / USB ou Rede Sem Fio 192.168.4.1)</option>
              <option value="WIFI_HTTP">Sem fio via Rede / Circuito (HTTP IP / AP da placa)</option>
              <option value="USB_PORT">Porta USB Serial no computador (ex: COM5)</option>
            </select>
          </div>

          @if (connectionMode() === 'USB_PORT') {
            <div class="field" style="margin-bottom: 16px;">
              <label for="target-port">Porta Serial (COM)</label>
              <input
                id="target-port"
                name="targetPort"
                type="text"
                placeholder="Ex: COM5"
                [ngModel]="targetPort()"
                (ngModelChange)="targetPort.set($event)"
              />
            </div>
          }

          @if (connectionMode() === 'WIFI_HTTP') {
            <div class="field" style="margin-bottom: 16px;">
              <label for="target-host">IP da Placa no Circuito (AP ou LAN)</label>
              <input
                id="target-host"
                name="targetHost"
                type="text"
                placeholder="Ex: 192.168.4.1"
                [ngModel]="targetHost()"
                (ngModelChange)="targetHost.set($event)"
              />
              <span class="cell-note">
                Quando a placa está no circuito sem cabo USB, ela cria o Wi-Fi <code>CidadeViva-Energy</code> ou <code>CidadeViva-Water</code> no IP <code>192.168.4.1</code>.
              </span>
            </div>
          }

          <div class="field" style="margin-bottom: 16px;">
            <label for="wifi-ssid">Nome da Rede Wi-Fi 2,4 GHz (SSID)</label>
            <input
              id="wifi-ssid"
              name="ssid"
              type="text"
              required
              maxlength="32"
              placeholder="Selecione na tabela ou digite o SSID"
              [ngModel]="selectedSsid()"
              (ngModelChange)="selectedSsid.set($event)"
            />
            @if (notebookSsid() && selectedSsid() !== notebookSsid()) {
              <button type="button" class="text-button" style="align-self: flex-start; padding: 2px 0; min-height: auto;" (click)="selectedSsid.set(notebookSsid()!)">
                Usar mesma rede do notebook ({{ notebookSsid() }})
              </button>
            }
          </div>

          <div class="field" style="margin-bottom: 18px;">
            <label for="wifi-password">Senha do Wi-Fi</label>
            <div style="display: flex; gap: 8px;">
              <input
                id="wifi-password"
                name="password"
                [type]="showPassword() ? 'text' : 'password'"
                maxlength="63"
                placeholder="8 a 63 caracteres (ou vazio se aberta)"
                [ngModel]="wifiPassword()"
                (ngModelChange)="wifiPassword.set($event)"
              />
              <button type="button" class="button secondary" style="flex-shrink: 0; padding-inline: 12px;" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="button primary"
            style="width: 100%;"
            [disabled]="connecting() || !selectedSsid().trim() || !store.auth.operator()"
          >
            {{ connecting() ? 'Conectando ESP32 ao Wi-Fi (aguarde até 30s)…' : 'Conectar placa na rede Wi-Fi' }}
          </button>

          @if (!store.auth.operator()) {
            <p class="control-help">Seu perfil é de consulta. Entre como operador para enviar credenciais Wi-Fi.</p>
          } @else {
            <p class="control-help">
              Após conectar, o ESP32 salva a rede na memória interna e reconecta automaticamente quando energizado no circuito.
            </p>
          }
        </form>

        <div class="control-section">
          <h3>Como funciona no circuito (sem cabo USB)</h3>
          <ol class="plain-list" style="margin: 0;">
            <li>Ao ligar na fonte da maquete, a placa tenta reconectar ao último Wi-Fi salvo e também disponibiliza o ponto de acesso <code>CidadeViva-Energy</code> / <code>CidadeViva-Water</code> (IP <code>192.168.4.1</code>).</li>
            <li>Selecione a mesma rede <strong>2,4 GHz</strong> em que o notebook está conectado.</li>
            <li>Clique em <strong>Conectar placa na rede Wi-Fi</strong> e confira o IP retornado no topo da página.</li>
          </ol>
        </div>
      </aside>
    </div>
    }
  `
})
export class WifiSetup implements OnInit {
  readonly isHosted = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);
  readonly api = inject(CityApi);
  readonly store = inject(CityStore);
  readonly name = deviceName;

  readonly scanning = signal(false);
  readonly connecting = signal(false);
  readonly scanError = signal('');
  readonly scannedAt = signal<string | null>(null);

  readonly notebookSsid = signal<string | null>(null);
  readonly notebookBand = signal<string | null>(null);
  readonly notebookSignal = signal<number | null>(null);
  readonly networks = signal<WifiNetwork[]>([]);
  readonly detectedBoards = signal<Esp32PortStatus[]>([]);

  readonly targetDeviceKey = signal<'esp32-energy' | 'esp32-water'>('esp32-energy');
  readonly connectionMode = signal<'AUTO' | 'WIFI_HTTP' | 'USB_PORT'>('AUTO');
  readonly targetPort = signal('COM5');
  readonly targetHost = signal('192.168.4.1');
  readonly selectedSsid = signal('');
  readonly wifiPassword = signal('');
  readonly showPassword = signal(false);
  readonly connectResult = signal<WifiConnectResult | null>(null);

  readonly compatibleNetworksCount = computed(() =>
    this.networks().filter(n => n.band.includes('2,4')).length
  );

  readonly detectedBoardsSummary = computed(() =>
    this.detectedBoards().map(b => `${b.deviceId} (${b.port})`).join(', ')
  );

  ngOnInit() {
    if (!this.isHosted) void this.scanNetworks();
  }

  onModeChange(mode: 'AUTO' | 'WIFI_HTTP' | 'USB_PORT') {
    this.connectionMode.set(mode);
  }

  selectNetwork(network: WifiNetwork) {
    this.selectedSsid.set(network.ssid);
  }

  selectBoard(board: Esp32PortStatus) {
    if (board.deviceId === 'esp32-water' || board.deviceId === 'esp32-energy') {
      this.targetDeviceKey.set(board.deviceId);
    }
    if (board.transport === 'USB_SERIAL') {
      this.connectionMode.set('USB_PORT');
      this.targetPort.set(board.port);
    } else {
      this.connectionMode.set('WIFI_HTTP');
      this.targetHost.set(board.port);
    }
  }

  async scanNetworks() {
    this.scanning.set(true);
    this.scanError.set('');
    try {
      const options: { port?: string; host?: string } = {};
      if (this.connectionMode() === 'USB_PORT' && this.targetPort().trim()) {
        options.port = this.targetPort().trim();
      } else if (this.connectionMode() === 'WIFI_HTTP' && this.targetHost().trim()) {
        options.host = this.targetHost().trim();
      }

      const overview = await this.api.scanWifi(options);
      this.notebookSsid.set(overview.notebookSsid);
      this.notebookBand.set(overview.notebookBand);
      this.notebookSignal.set(overview.notebookSignalPercent);
      this.networks.set(overview.networks);
      this.detectedBoards.set(overview.detectedBoards);
      this.scannedAt.set(overview.scannedAt);

      if (!this.selectedSsid() && overview.notebookSsid) {
        this.selectedSsid.set(overview.notebookSsid);
      } else if (!this.selectedSsid() && overview.networks.length > 0) {
        this.selectedSsid.set(overview.networks[0].ssid);
      }
    } catch (error) {
      if (this.connectionMode() === 'WIFI_HTTP' && this.targetHost().trim()) {
        try {
          const direct = await this.api.scanBoardHttpDirect(this.targetHost().trim());
          this.networks.set(
            direct.networks.map(n => ({
              ssid: n.ssid,
              rssi: n.rssi,
              signalPercent: Math.min(100, Math.max(5, 2 * (n.rssi + 100))),
              channel: n.channel,
              band: '2,4 GHz',
              auth: n.auth,
              isCurrentNotebookNetwork: false,
              source: `ESP32 (${this.targetHost().trim()})`
            }))
          );
          this.scannedAt.set(new Date().toISOString());
          return;
        } catch {
          // Fallthrough to error message
        }
      }
      this.scanError.set(friendlyError(error));
    } finally {
      this.scanning.set(false);
    }
  }

  async connectBoard() {
    const ssid = this.selectedSsid().trim();
    const password = this.wifiPassword();
    if (!ssid || this.connecting()) return;

    if (password.length > 0 && (password.length < 8 || password.length > 63)) {
      this.connectResult.set({
        connected: false,
        target: this.targetDeviceKey(),
        ssid,
        ip: null,
        message: 'A senha do Wi-Fi deve ter entre 8 e 63 caracteres (ou ficar em branco para rede aberta).',
        completedAt: new Date().toISOString()
      });
      return;
    }

    this.connecting.set(true);
    this.connectResult.set(null);
    this.scanError.set('');

    try {
      const mode = this.connectionMode();
      const result = await this.api.connectWifi({
        ssid,
        password,
        deviceKey: this.targetDeviceKey(),
        targetPort: mode === 'USB_PORT' ? this.targetPort().trim() : mode === 'AUTO' ? this.targetPort().trim() || undefined : undefined,
        targetHost: mode === 'WIFI_HTTP' ? this.targetHost().trim() : undefined
      });
      this.connectResult.set(result);
      this.wifiPassword.set('');
      void this.scanNetworks();
      void this.store.refresh();
    } catch (error) {
      if (this.connectionMode() === 'WIFI_HTTP' && this.targetHost().trim()) {
        try {
          const direct = await this.api.connectBoardHttpDirect(this.targetHost().trim(), ssid, password);
          this.connectResult.set({
            connected: true,
            target: this.targetHost().trim(),
            ssid,
            ip: direct.ip !== '0.0.0.0' ? direct.ip : null,
            message: `Credenciais enviadas diretamente para a placa (${this.targetHost().trim()}). Conectando ao Wi-Fi '${ssid}'.`,
            completedAt: new Date().toISOString()
          });
          this.wifiPassword.set('');
          return;
        } catch {
          // Fallthrough
        }
      }
      this.scanError.set(friendlyError(error));
    } finally {
      this.connecting.set(false);
    }
  }
}
