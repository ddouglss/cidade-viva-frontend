import { Command, Device } from './models';

export const deviceName = (key: string) => key === 'esp32-water' ? 'Hidráulica e irrigação' : key === 'esp32-energy' ? 'Energia e mobilidade' : key;
export const originLabel = (origin: string | null) => ({ PHYSICAL_SENSOR: 'Sensor físico', SIMULATED_INPUT: 'SIMULAÇÃO', CALCULATED: 'Calculado' }[origin ?? ''] ?? 'Origem não informada');
export const qualityLabel = (quality: string | null) => ({ VALID: 'Válida', INVALID: 'Inválida', STALE: 'Desatualizada', UNSYNCHRONIZED_TIME: 'Horário não sincronizado' }[quality ?? ''] ?? 'Sem leitura');
export const actionLabel = (action: string) => ({ PUMP_PULSE: 'Pulso de irrigação', SET_LIGHT_MAIN: 'Iluminação principal', SET_LIGHT_MODE: 'Modo de iluminação', SET_IRRIGATION_MODE: 'Modo de irrigação', REQUEST_CROSSING: 'Pedido de travessia' }[action] ?? action);
export const commandLabel = (command: Command) => ({ REQUESTED: 'Enviando solicitação', PENDING: 'Aguardando publicação', PUBLISHED: 'Aguardando dispositivo', RECEIVED: 'Recebido pelo dispositivo', APPLIED: 'Aplicado no controlador', REJECTED: 'Recusado', EXPIRED: 'Expirado', TIMED_OUT: 'Tempo de resposta esgotado', UNCONFIRMED: 'Resultado não confirmado', FAILED: 'Solicitação não aceita' }[command.status]);
export const reasonLabel = (reason: string | null) => ({ RESERVOIR_LOW: 'Reservatório com nível baixo. O controlador bloqueou a bomba.', COMMAND_EXPIRED: 'O comando expirou antes de ser aplicado.', COOLDOWN_OR_MODE: 'O controlador está em pausa ou em outro modo.', UNSUPPORTED_SIMULATION_ACTION: 'Esta ação ainda não é suportada pelo simulador.', PUBLICATION_UNCERTAIN: 'A publicação não pôde ser confirmada. Consulte o resultado; não reenvie o comando.', TIMED_OUT: 'Não houve confirmação no prazo. Isso não comprova se houve atuação.', EXPIRED: 'O comando expirou na fila.', INVALID_DURATION: 'A duração está fora do limite permitido.', COMMAND_LOOKUP_NOT_FOUND: 'A plataforma ainda não localizou este comando. Consulte o mesmo ID antes de solicitar outra ação.', NETWORK_ERROR: 'A resposta da plataforma não chegou. Consulte o mesmo comando antes de qualquer nova solicitação.' }[reason ?? ''] ?? (reason ? 'O controlador não confirmou a solicitação. Consulte os detalhes do comando.' : ''));
export const causeLabel = (cause: string) => ({ RESERVOIR_LOW: 'Nível baixo no reservatório', SENSOR_INVALID: 'Leitura de sensor inválida', DEVICE_OFFLINE: 'Dispositivo sem comunicação' }[cause] ?? 'Ocorrência do dispositivo');
export const numberMetric = (device: Device | undefined, key: string): number | null => typeof device?.measurements[key] === 'number' && Number.isFinite(device.measurements[key]) ? device.measurements[key] as number : null;
export const reportedBoolean = (device: Device | undefined, key: string): string => typeof device?.actuators[key] === 'boolean' ? device.actuators[key] ? 'Ligado' : 'Desligado' : 'Sem informação';
export function commandBlockReason(device: Device | undefined, operator: boolean, pending: boolean, action: string): string {
  if (!operator) return 'Perfil de consulta: comandos disponíveis somente para operador.';
  if (!device) return 'Aguardando dados do dispositivo.';
  if (pending) return 'Aguarde a confirmação do comando anterior.';
  if (!device.online || device.isStale) return 'Dispositivo offline ou dados desatualizados.';
  if (device.quality !== 'VALID') return 'O dispositivo precisa de uma leitura válida e horário sincronizado.';
  if (action === 'PUMP_PULSE') {
    if (device.measurements['reservoirLow'] !== false) return device.measurements['reservoirLow'] === true ? 'Reservatório baixo: a bomba está bloqueada.' : 'Nível do reservatório desconhecido: a bomba está bloqueada.';
    if (device.mode !== 'MANUAL') return 'Selecione o modo manual antes de solicitar um pulso.';
  }
  if (action === 'SET_LIGHT_MAIN' && device.mode !== 'MANUAL') return 'Selecione o modo manual para comandar a iluminação.';
  if (action === 'REQUEST_CROSSING' && typeof device.actuators['trafficState'] !== 'string') return 'Aguardando telemetria da sinalização.';
  return '';
}
