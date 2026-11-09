import { describe, expect, it } from 'vitest';
import { DEFAULT_CITY_ASSETS, resolveAssetSnapshot } from './city-scene';
import { ImprovementsStore } from './improvements-store';
import { Device } from './models';

describe('CityScene & Improvements SDD v1.2', () => {
  const energyDevice: Device = {
    id: '1',
    deviceKey: 'esp32-energy',
    zoneCode: 'Z1',
    firmwareVersion: '1.2.0',
    online: true,
    reportedOnline: true,
    isStale: false,
    mode: 'MANUAL',
    origin: 'SIMULATED_INPUT',
    quality: 'VALID',
    lastSeenAt: '2026-11-09T15:00:00Z',
    lastTelemetryAt: '2026-11-09T15:00:00Z',
    measurements: { illuminanceLux: 142 },
    actuators: { mainLightOn: true, trafficState: 'A_GREEN' },
    automationRules: []
  };

  it('projeta o estado real do esp32-energy nos dois postes do ramal principal', () => {
    const p1 = DEFAULT_CITY_ASSETS.find(a => a.id === 'streetlight-main-01')!;
    const p2 = DEFAULT_CITY_ASSETS.find(a => a.id === 'streetlight-main-02')!;
    const s1 = resolveAssetSnapshot(p1, [energyDevice], []);
    const s2 = resolveAssetSnapshot(p2, [energyDevice], []);

    expect(s1.connectivity).toBe('ONLINE');
    expect(s1.primaryStateLabel).toContain('Ligado');
    expect(s2.primaryStateLabel).toContain('Ligado');
    expect(s1.originText).toBe('SIMULAÇÃO');
  });

  it('mantém postes solares como circuito autônomo não instrumentado e cancela sob flag de hardware', () => {
    const solar = DEFAULT_CITY_ASSETS.find(a => a.id === 'solar-poles-01-04')!;
    const gate = DEFAULT_CITY_ASSETS.find(a => a.id === 'mobility-gate-01')!;
    const solarSnap = resolveAssetSnapshot(solar, [energyDevice], []);
    const gateSnap = resolveAssetSnapshot(gate, [energyDevice], []);

    expect(solarSnap.connectivity).toBe('AUTONOMOUS');
    expect(solarSnap.originText).toBe('Não instrumentado');
    expect(gateSnap.connectivity).toBe('UNSUPPORTED');
    expect(gateSnap.asset.supportedActions).toEqual([]);
  });

  it('cria e transiciona proposta de melhoria com trilha de auditoria', () => {
    const store = new ImprovementsStore();
    const created = store.create({
      title: 'Teste de histerese',
      problem: 'Oscilação de lux',
      hypothesis: 'Aplicar banda morta',
      zoneId: 'residential',
      assetId: 'streetlight-main-01',
      deviceKey: 'esp32-energy',
      source: 'GEMINI',
      priority: 'HIGH',
      impact: 'Menor comutação',
      effort: 'BAIXO',
      baselineMetric: 'illuminanceLux',
      validationPlan: 'Medir 1h',
      provenanceNote: 'Teste unitário',
      actor: 'operator'
    });

    expect(created.status).toBe('IDEA');
    store.transition(created.id, 'APPROVED', 'operator');
    const updated = store.items().find(i => i.id === created.id)!;
    expect(updated.status).toBe('APPROVED');
    expect(updated.activities[0].action).toContain('Aprovada');
  });
});
