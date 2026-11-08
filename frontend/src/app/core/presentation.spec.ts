import { commandBlockReason, commandLabel, numberMetric, originLabel, reportedBoolean } from './presentation';
import { Command, Device } from './models';

export const waterFixture: Device = { id:'water-id', deviceKey:'esp32-water', zoneCode:'WATER_IRRIGATION', firmwareVersion:'test-sim',
  online:true, reportedOnline:true, isStale:false, mode:'MANUAL', origin:'SIMULATED_INPUT', quality:'VALID',
  lastSeenAt:new Date().toISOString(), lastTelemetryAt:new Date().toISOString(), measurements:{soilHumidityPct:37.2,reservoirLow:false},
  actuators:{pumpOn:false}, automationRules:[] };
describe('Políticas de exibição e pré-validação', () => {
  it('identifica simulação e mantém ausência de leitura diferente de zero/desligado', () => {
    expect(originLabel('SIMULATED_INPUT')).toBe('SIMULAÇÃO');
    expect(numberMetric(undefined,'soilHumidityPct')).toBeNull();
    expect(reportedBoolean(undefined,'pumpOn')).toBe('Sem informação');
    expect(numberMetric({...waterFixture,measurements:{soilHumidityPct:0}},'soilHumidityPct')).toBe(0);
  });
  it.each([
    [{...waterFixture,online:false},'offline'],
    [{...waterFixture,isStale:true},'desatualizados'],
    [{...waterFixture,quality:'INVALID'},'válida'],
    [{...waterFixture,measurements:{reservoirLow:true}},'Reservatório baixo'],
    [{...waterFixture,measurements:{}},'desconhecido'],
    [{...waterFixture,mode:'AUTO'},'manual']
  ])('bloqueia pulso em condição insegura', (device, reason) => {
    expect(commandBlockReason(device as Device,true,false,'PUMP_PULSE')).toContain(reason);
  });
  it('não permite viewer nem reenvio enquanto aguarda confirmação', () => {
    expect(commandBlockReason(waterFixture,false,false,'PUMP_PULSE')).toContain('consulta');
    expect(commandBlockReason(waterFixture,true,true,'PUMP_PULSE')).toContain('anterior');
    expect(commandBlockReason(waterFixture,true,false,'PUMP_PULSE')).toBe('');
  });
  it('não transforma 202, publicação ou recebimento em execução', () => {
    for (const status of ['REQUESTED','PENDING','PUBLISHED','RECEIVED'] as const)
      expect(commandLabel({status} as Command)).not.toContain('Aplicado');
    expect(commandLabel({status:'APPLIED'} as Command)).toBe('Aplicado no controlador');
  });
});
