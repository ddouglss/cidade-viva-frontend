import { CityAlert, DataOrigin, DataQuality, Device } from './models';
import { numberMetric, originLabel, qualityLabel, reportedBoolean } from './presentation';

export type AssetKind =
  | 'CONTROL_CENTER'
  | 'LIGHT'
  | 'SOLAR_LIGHT'
  | 'TRAFFIC'
  | 'PEDESTRIAN'
  | 'GATE'
  | 'RESERVOIR'
  | 'PUMP'
  | 'GARDEN_SENSOR'
  | 'LUX_SENSOR'
  | 'SIREN';

export type CityLayerId = 'infra' | 'energy' | 'solar' | 'water' | 'mobility' | 'sensors';

export interface CityLayer {
  id: CityLayerId;
  label: string;
  color: string;
}

export interface SceneAsset {
  id: string;
  zoneId: 'control' | 'residential' | 'solar' | 'mobility' | 'water';
  zoneName: string;
  layer: CityLayerId;
  kind: AssetKind;
  displayName: string;
  shortLabel: string;
  subtitle: string;
  geometry: { x: number; y: number };
  binding?: {
    deviceKey: 'esp32-energy' | 'esp32-water';
    capabilityId: string;
  };
  supportedActions: string[];
  routePath: string;
  instrumentationNote: string;
}

export interface ResolvedAssetSnapshot {
  asset: SceneAsset;
  device?: Device;
  connectivity: 'ONLINE' | 'OFFLINE' | 'STALE' | 'AUTONOMOUS' | 'UNSUPPORTED';
  connectivityLabel: string;
  origin: DataOrigin | null;
  originText: string;
  quality: DataQuality | null;
  qualityText: string;
  lastTelemetryAt: string | null;
  primaryStateLabel: string;
  secondaryMetricLabel: string;
  isActiveVisual: boolean;
  isWarningVisual: boolean;
  activeAlerts: CityAlert[];
}

export const CITY_LAYERS: CityLayer[] = [
  { id: 'infra', label: 'Centro & Vias', color: '#42694a' },
  { id: 'energy', label: 'Iluminação 5V', color: '#287454' },
  { id: 'solar', label: 'Solar Autônomo', color: '#b38728' },
  { id: 'water', label: 'Hidráulica & Horta', color: '#226d86' },
  { id: 'mobility', label: 'Mobilidade & Travessia', color: '#3b6978' },
  { id: 'sensors', label: 'Sensores & Alertas', color: '#996e21' }
];

export const DEFAULT_CITY_ASSETS: SceneAsset[] = [
  {
    id: 'streetlight-main-01',
    zoneId: 'residential',
    zoneName: 'Setor Residencial · Ramal Principal',
    layer: 'energy',
    kind: 'LIGHT',
    displayName: 'Poste Principal 01 (Ramal 5V)',
    shortLabel: 'Poste 01',
    subtitle: 'Compartilha o canal principal de iluminação com o Poste 02',
    geometry: { x: 118, y: 74 },
    binding: { deviceKey: 'esp32-energy', capabilityId: 'mainLightOn' },
    supportedActions: ['SET_LIGHT_MODE', 'SET_LIGHT_MAIN'],
    routePath: '/energia',
    instrumentationNote: 'Estado lógico reportado pelo esp32-energy. Sem sensor fotométrico individual na lâmpada.'
  },
  {
    id: 'streetlight-main-02',
    zoneId: 'residential',
    zoneName: 'Setor Residencial · Ramal Principal',
    layer: 'energy',
    kind: 'LIGHT',
    displayName: 'Poste Principal 02 (Ramal 5V)',
    shortLabel: 'Poste 02',
    subtitle: 'Segundo poste do ramal principal 5V controlado pelo ESP32 Energia',
    geometry: { x: 245, y: 74 },
    binding: { deviceKey: 'esp32-energy', capabilityId: 'mainLightOn' },
    supportedActions: ['SET_LIGHT_MODE', 'SET_LIGHT_MAIN'],
    routePath: '/energia',
    instrumentationNote: 'Acionado em conjunto no mesmo barramento do Ramal Principal.'
  },
  {
    id: 'sensor-lux-01',
    zoneId: 'residential',
    zoneName: 'Setor Residencial · Sensoriamento',
    layer: 'sensors',
    kind: 'LUX_SENSOR',
    displayName: 'Sensor de Luminosidade (BH1750)',
    shortLabel: 'Lux BH1750',
    subtitle: 'Medição de iluminância ambiente para automação crepuscular',
    geometry: { x: 182, y: 48 },
    binding: { deviceKey: 'esp32-energy', capabilityId: 'illuminanceLux' },
    supportedActions: ['SET_LIGHT_MODE'],
    routePath: '/energia',
    instrumentationNote: 'Informa iluminância em lux (lx) com etiqueta de origem (Sensor Físico ou Simulação).'
  },
  {
    id: 'reservoir-tank-01',
    zoneId: 'water',
    zoneName: 'Setor Hidráulico · Reservatório',
    layer: 'water',
    kind: 'RESERVOIR',
    displayName: 'Reservatório & Boia de Nível',
    shortLabel: 'Reservatório',
    subtitle: 'Monitoramento de nível mínimo com intertravamento local da bomba',
    geometry: { x: 452, y: 58 },
    binding: { deviceKey: 'esp32-water', capabilityId: 'reservoirLow' },
    supportedActions: [],
    routePath: '/hidraulica',
    instrumentationNote: 'Boia física no controlador esp32-water bloqueia o acionamento da bomba em nível baixo.'
  },
  {
    id: 'irrigation-pump-01',
    zoneId: 'water',
    zoneName: 'Setor Hidráulico · Bombeamento',
    layer: 'water',
    kind: 'PUMP',
    displayName: 'Bomba de Irrigação & Tubulação',
    shortLabel: 'Bomba 5V',
    subtitle: 'Acionamento temporizado com proteção local de nível e duração máxima',
    geometry: { x: 548, y: 78 },
    binding: { deviceKey: 'esp32-water', capabilityId: 'pumpOn' },
    supportedActions: ['SET_IRRIGATION_MODE', 'PUMP_PULSE'],
    routePath: '/hidraulica',
    instrumentationNote: 'Comando reportado pelo controlador; não há sensor de vazão volumétrica instalado.'
  },
  {
    id: 'horta-zone-01',
    zoneId: 'water',
    zoneName: 'Setor Hidráulico · Horta Demonstrativa',
    layer: 'water',
    kind: 'GARDEN_SENSOR',
    displayName: 'Horta & Sensor de Umidade da Amostra',
    shortLabel: 'Horta / Solo',
    subtitle: 'Canteiro demonstrativo com leitura de umidade percentual e ADC bruto',
    geometry: { x: 642, y: 102 },
    binding: { deviceKey: 'esp32-water', capabilityId: 'soilHumidityPct' },
    supportedActions: ['SET_IRRIGATION_MODE', 'PUMP_PULSE'],
    routePath: '/hidraulica',
    instrumentationNote: 'Diferencia claramente leitura de amostra física (ADC/%) e entrada simulada.'
  },
  {
    id: 'traffic-cross-01',
    zoneId: 'mobility',
    zoneName: 'Cruzamento Central · Semáforos',
    layer: 'mobility',
    kind: 'TRAFFIC',
    displayName: 'Cruzamento Semafórico (Vias A e B)',
    shortLabel: 'Semáforos',
    subtitle: 'Sinalização viária coordenada pela máquina de estados do controlador',
    geometry: { x: 350, y: 185 },
    binding: { deviceKey: 'esp32-energy', capabilityId: 'trafficState' },
    supportedActions: ['REQUEST_CROSSING'],
    routePath: '/mobilidade',
    instrumentationNote: 'Transições seguras executadas no firmware; UI jamais força fases conflitantes.'
  },
  {
    id: 'pedestrian-btn-01',
    zoneId: 'mobility',
    zoneName: 'Cruzamento Central · Acessibilidade',
    layer: 'mobility',
    kind: 'PEDESTRIAN',
    displayName: 'Travessia Acessível & Buzzer Sonoro',
    shortLabel: 'Travessia / Buzzer',
    subtitle: 'Botoeira de pedestre e sinal sonoro de travessia assistida',
    geometry: { x: 284, y: 238 },
    binding: { deviceKey: 'esp32-energy', capabilityId: 'trafficState' },
    supportedActions: ['REQUEST_CROSSING'],
    routePath: '/mobilidade',
    instrumentationNote: 'Buzzer de acessibilidade distinto da sirene de emergência.'
  },
  {
    id: 'mobility-gate-01',
    zoneId: 'mobility',
    zoneName: 'Acesso Viário · Cancela',
    layer: 'mobility',
    kind: 'GATE',
    displayName: 'Cancela Veicular do Laboratório',
    shortLabel: 'Cancela',
    subtitle: 'Ativo mapeado na planta física sob feature flag de hardware',
    geometry: { x: 138, y: 292 },
    supportedActions: [],
    routePath: '/mobilidade',
    instrumentationNote: 'Aguardando homologação de motor/driver e fim de curso. Controle desabilitado por segurança.'
  },
  {
    id: 'solar-poles-01-04',
    zoneId: 'solar',
    zoneName: 'Setor Sustentável · Circuito Solar',
    layer: 'solar',
    kind: 'SOLAR_LIGHT',
    displayName: '4 Postes Solares Autônomos (PV)',
    shortLabel: '4 Postes Solares',
    subtitle: 'Circuito físico independente: Painel PV → Controlador → Bateria → LED',
    geometry: { x: 545, y: 286 },
    supportedActions: [],
    routePath: '/energia',
    instrumentationNote: 'Não instrumentado com INA219/telemetria no MVP. Nenhum valor fictício de geração é exibido.'
  },
  {
    id: 'ctrl-center',
    zoneId: 'control',
    zoneName: 'Caixa Técnica · Centro de Controle',
    layer: 'infra',
    kind: 'CONTROL_CENTER',
    displayName: 'Centro de Controle (2× ESP32)',
    shortLabel: 'Central ESP32',
    subtitle: 'Barramento local protegido 5V, comunicação MQTT e proteções de firmware',
    geometry: { x: 88, y: 196 },
    binding: { deviceKey: 'esp32-energy', capabilityId: 'online' },
    supportedActions: [],
    routePath: '/dispositivos',
    instrumentationNote: 'Reúne esp32-energy (Energia/Mobilidade) e esp32-water (Hidráulica/Irrigação).'
  },
  {
    id: 'emergency-siren-01',
    zoneId: 'control',
    zoneName: 'Atenção Operacional · Alerta Geral',
    layer: 'sensors',
    kind: 'SIREN',
    displayName: 'Sinalizador de Ocorrências & Alertas',
    shortLabel: 'Sinalizador',
    subtitle: 'Monitoramento de causas ativas e reconhecimento auditado pelo operador',
    geometry: { x: 425, y: 298 },
    supportedActions: [],
    routePath: '/alertas',
    instrumentationNote: 'Reconhecer alerta registra ciência operacional, sem mascarar causa física ativa.'
  }
];

export function resolveAssetSnapshot(
  asset: SceneAsset,
  devices: Device[],
  alerts: CityAlert[]
): ResolvedAssetSnapshot {
  const device = asset.binding ? devices.find(d => d.deviceKey === asset.binding!.deviceKey) : undefined;
  const activeAlerts = alerts.filter(a => a.active && (!asset.binding || a.deviceKey === asset.binding.deviceKey));

  if (asset.kind === 'SOLAR_LIGHT') {
    return {
      asset,
      connectivity: 'AUTONOMOUS',
      connectivityLabel: 'Circuito autônomo',
      origin: null,
      originText: 'Não instrumentado',
      quality: null,
      qualityText: 'Sem telemetria elétrica',
      lastTelemetryAt: null,
      primaryStateLabel: 'Operação fotoelétrica autônoma (4 postes)',
      secondaryMetricLabel: 'Tensão/corrente solar: Não instrumentado',
      isActiveVisual: true,
      isWarningVisual: false,
      activeAlerts: []
    };
  }

  if (asset.kind === 'GATE') {
    return {
      asset,
      connectivity: 'UNSUPPORTED',
      connectivityLabel: 'Aguardando hardware',
      origin: null,
      originText: 'Não homologado',
      quality: null,
      qualityText: 'Feature flag inativa',
      lastTelemetryAt: null,
      primaryStateLabel: 'Controle de cancela bloqueado (driver pendente)',
      secondaryMetricLabel: 'Ativo cadastrado na planta 2D',
      isActiveVisual: false,
      isWarningVisual: false,
      activeAlerts: []
    };
  }

  if (asset.kind === 'SIREN') {
    const openCount = alerts.filter(a => a.active).length;
    return {
      asset,
      connectivity: openCount > 0 ? 'ONLINE' : 'AUTONOMOUS',
      connectivityLabel: openCount > 0 ? `${openCount} alerta(s) ativo(s)` : 'Sem ocorrências',
      origin: devices[0]?.origin ?? null,
      originText: devices[0] ? originLabel(devices[0].origin) : 'Monitoramento da plataforma',
      quality: devices[0]?.quality ?? null,
      qualityText: devices[0] ? qualityLabel(devices[0].quality) : 'Consolidado',
      lastTelemetryAt: devices[0]?.lastTelemetryAt ?? null,
      primaryStateLabel: openCount > 0 ? `${openCount} causa(s) ativa(s) exigindo atenção` : 'Nenhuma causa ativa no laboratório',
      secondaryMetricLabel: 'Reconhecimento separado da resolução física',
      isActiveVisual: openCount > 0,
      isWarningVisual: openCount > 0,
      activeAlerts: alerts.filter(a => a.active)
    };
  }

  if (asset.kind === 'CONTROL_CENTER') {
    const onlineCount = devices.filter(d => d.online && !d.isStale).length;
    const anyStale = devices.some(d => d.isStale);
    return {
      asset,
      device,
      connectivity: onlineCount === devices.length && devices.length > 0 ? 'ONLINE' : anyStale ? 'STALE' : 'OFFLINE',
      connectivityLabel: `${onlineCount}/${devices.length || 2} online`,
      origin: device?.origin ?? null,
      originText: device ? originLabel(device.origin) : 'Multi-controlador',
      quality: device?.quality ?? null,
      qualityText: device ? qualityLabel(device.quality) : 'Sem leitura',
      lastTelemetryAt: device?.lastTelemetryAt ?? null,
      primaryStateLabel: `Controladores ativos: ${onlineCount} de ${devices.length || 2}`,
      secondaryMetricLabel: `Alertas ativos: ${alerts.filter(a => a.active).length}`,
      isActiveVisual: onlineCount > 0,
      isWarningVisual: onlineCount < (devices.length || 2),
      activeAlerts: alerts.filter(a => a.active)
    };
  }

  const connectivity: ResolvedAssetSnapshot['connectivity'] =
    !device ? 'OFFLINE' : device.isStale ? 'STALE' : device.online ? 'ONLINE' : 'OFFLINE';
  const connectivityLabel =
    connectivity === 'ONLINE' ? 'Online' : connectivity === 'STALE' ? 'Desatualizado' : 'Offline';

  let primaryStateLabel = 'Sem informação';
  let secondaryMetricLabel = `Modo: ${device?.mode ?? 'Não informado'}`;
  let isActiveVisual = false;
  let isWarningVisual = connectivity !== 'ONLINE' || activeAlerts.length > 0;

  switch (asset.kind) {
    case 'LIGHT': {
      const lightState = reportedBoolean(device, 'mainLightOn');
      const lux = numberMetric(device, 'illuminanceLux');
      primaryStateLabel = `Iluminação: ${lightState}`;
      secondaryMetricLabel = `Modo: ${device?.mode ?? '—'} · Lux: ${lux !== null ? lux + ' lx' : '—'}`;
      isActiveVisual = device?.actuators['mainLightOn'] === true;
      break;
    }
    case 'LUX_SENSOR': {
      const lux = numberMetric(device, 'illuminanceLux');
      primaryStateLabel = lux !== null ? `Iluminância: ${lux.toLocaleString('pt-BR')} lx` : 'Iluminância: Sem leitura';
      secondaryMetricLabel = `Controle crepuscular (${device?.mode ?? '—'})`;
      isActiveVisual = lux !== null;
      break;
    }
    case 'RESERVOIR': {
      const low = device?.measurements['reservoirLow'];
      primaryStateLabel = low === true ? 'Nível baixo (Bomba bloqueada)' : low === false ? 'Nível normal operante' : 'Nível desconhecido (Bloqueado)';
      secondaryMetricLabel = low === false ? 'Intertravamento liberado' : 'Proteção local de boia ativa';
      isActiveVisual = low === false;
      isWarningVisual = low !== false || isWarningVisual;
      break;
    }
    case 'PUMP': {
      const pumpState = reportedBoolean(device, 'pumpOn');
      const low = device?.measurements['reservoirLow'];
      primaryStateLabel = `Bomba: ${pumpState}`;
      secondaryMetricLabel = `Modo: ${device?.mode ?? '—'} · Boia: ${low === false ? 'Normal' : 'Bloqueada'} · Vazão não medida`;
      isActiveVisual = device?.actuators['pumpOn'] === true;
      break;
    }
    case 'GARDEN_SENSOR': {
      const hum = numberMetric(device, 'soilHumidityPct');
      const adc = numberMetric(device, 'soilAdcRaw');
      primaryStateLabel = hum !== null ? `Umidade da amostra: ${hum.toLocaleString('pt-BR')}%` : 'Umidade: Sem leitura';
      secondaryMetricLabel = adc !== null ? `ADC bruto: ${adc} · Irrigação ${device?.mode ?? '—'}` : `Irrigação: ${device?.mode ?? '—'}`;
      isActiveVisual = hum !== null;
      break;
    }
    case 'TRAFFIC':
    case 'PEDESTRIAN': {
      const rawPhase = typeof device?.actuators['trafficState'] === 'string' ? (device.actuators['trafficState'] as string) : null;
      primaryStateLabel = rawPhase ? `Fase reportada: ${rawPhase}` : 'Sem telemetria de fase';
      secondaryMetricLabel = asset.kind === 'PEDESTRIAN'
        ? 'Travessia segura sob autoridade do controlador'
        : 'Sinaleiros A/B sincronizados no firmware';
      isActiveVisual = !!rawPhase;
      break;
    }
  }

  return {
    asset,
    device,
    connectivity,
    connectivityLabel,
    origin: device?.origin ?? null,
    originText: originLabel(device?.origin ?? null),
    quality: device?.quality ?? null,
    qualityText: qualityLabel(device?.quality ?? null),
    lastTelemetryAt: device?.lastTelemetryAt ?? null,
    primaryStateLabel,
    secondaryMetricLabel,
    isActiveVisual,
    isWarningVisual,
    activeAlerts
  };
}
