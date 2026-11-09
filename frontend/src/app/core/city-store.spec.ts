import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CityStore } from './city-store';
import { CityApi } from './api';
import { AuthService } from './auth';
import { CityLive } from './live';
import { Command, Device, Identity } from './models';

const device: Device={id:'water-id',deviceKey:'esp32-water',zoneCode:'WATER_IRRIGATION',firmwareVersion:'test-sim',online:true,reportedOnline:true,isStale:false,mode:'MANUAL',origin:'SIMULATED_INPUT',quality:'VALID',lastSeenAt:null,lastTelemetryAt:null,measurements:{reservoirLow:false},actuators:{pumpOn:false},automationRules:[]};
describe('Estado da cidade e comandos',()=>{
  const user=signal<Identity|null>(null);
  const api={devices:vi.fn(),alerts:vi.fn(),requestCommand:vi.fn(),command:vi.fn()};
  const live={status:signal('connected'),start:vi.fn().mockResolvedValue(undefined),stop:vi.fn().mockResolvedValue(undefined)};
  let store:CityStore;
  beforeEach(async()=>{
    vi.clearAllMocks(); user.set(null); api.devices.mockResolvedValue([device]);api.alerts.mockResolvedValue([]);
    TestBed.configureTestingModule({providers:[{provide:CityApi,useValue:api},{provide:AuthService,useValue:{user,operator:()=>user()?.role==='operator',accessToken:()=> 'test-token'}},{provide:CityLive,useValue:live}]});
    store=TestBed.inject(CityStore);TestBed.tick();user.set({id:'operator-id',username:'operator',role:'operator'});TestBed.tick();await store.refresh();
  });
  it('bloqueia repetição e não liga a bomba por HTTP 202',async()=>{
    let resolve!:(value:Command)=>void;
    api.requestCommand.mockImplementation(()=>new Promise<Command>(r=>resolve=r));
    const sending=store.send(device,'PUMP_PULSE',{durationMs:100});
    expect(store.commands()[0].status).toBe('REQUESTED');
    const refreshCount=api.devices.mock.calls.length;
    store.scheduleRefresh();
    await vi.waitFor(()=>expect(api.devices.mock.calls.length).toBeGreaterThan(refreshCount));
    expect(api.command).not.toHaveBeenCalled();
    await store.send(device,'PUMP_PULSE',{durationMs:100});
    expect(api.requestCommand).toHaveBeenCalledTimes(1);
    const pending={...store.commands()[0],status:'PENDING'} as Command;
    api.command.mockResolvedValue(pending);resolve(pending);await sending;await Promise.resolve();
    expect(store.commands()[0].status).toBe('PENDING');
    expect(store.water()?.actuators['pumpOn']).toBe(false);
    store.mergeCommand({...pending,status:'REJECTED',reason:'RESERVOIR_LOW'});
    store.mergeCommand(pending);
    expect(store.commands()[0].status).toBe('REJECTED');
    expect(store.water()?.actuators['pumpOn']).toBe(false);
  });
  it('mantém última leitura e bloqueia comandos após erro de snapshot',async()=>{
    api.devices.mockRejectedValue(new Error('offline'));
    await store.refresh();
    expect(store.water()?.deviceKey).toBe('esp32-water');
    expect(store.water()?.online).toBe(false);expect(store.water()?.isStale).toBe(true);
    expect(store.error()).not.toBe('');
    expect(store.blocked(device,'PUMP_PULSE')).not.toBe('');
  });
  it('consulta novamente quando o SignalR atualiza durante um snapshot', async () => {
    let resolve!: (devices: Device[]) => void;
    const updated = { ...device, online: false, isStale: true };
    api.devices.mockImplementationOnce(() => new Promise<Device[]>(r => resolve = r));
    api.devices.mockResolvedValue([updated]);
    const inFlight = store.refresh();
    const requestCount = api.devices.mock.calls.length;
    vi.useFakeTimers();
    try {
      const onSignalRUpdate = live.start.mock.calls[0][1] as () => void;
      onSignalRUpdate();
      onSignalRUpdate();
      await vi.advanceTimersByTimeAsync(120);
      expect(api.devices).toHaveBeenCalledTimes(requestCount);
      resolve([device]);
      await inFlight;
      await store.refresh();
      expect(api.devices).toHaveBeenCalledTimes(requestCount + 1);
      expect(store.water()).toEqual(updated);
    } finally {
      vi.useRealTimers();
    }
  });
  it('mantém comando indeterminado bloqueado até consultar o mesmo UUID', async () => {
    api.requestCommand.mockRejectedValue(new HttpErrorResponse({ status: 0 }));
    await store.send(device, 'PUMP_PULSE', { durationMs: 100 });
    const command = store.commands()[0];
    expect(command.status).toBe('UNCONFIRMED');
    api.command.mockRejectedValueOnce(new HttpErrorResponse({ status: 404 }));
    await store.checkCommand(command.commandId);
    expect(store.commands()[0].reason).toBe('COMMAND_LOOKUP_NOT_FOUND');
    const requestCount = api.devices.mock.calls.length;
    store.scheduleRefresh();
    await vi.waitFor(() => expect(api.devices.mock.calls.length).toBeGreaterThan(requestCount));
    expect(api.command).toHaveBeenCalledTimes(1);
    await store.send(device, 'PUMP_PULSE', { durationMs: 100 });
    expect(api.requestCommand).toHaveBeenCalledTimes(1);
    api.command.mockResolvedValueOnce({ ...command, status: 'TIMED_OUT', reason: 'TIMED_OUT' });
    await store.checkCommand(command.commandId);
    expect(store.commands()[0].status).toBe('TIMED_OUT');
    expect(store.pending(device.deviceKey)).toBe(false);
    expect(store.water()?.actuators['pumpOn']).toBe(false);
  });
  it('preserva pendentes ao limitar comandos concluídos', async () => {
    api.requestCommand.mockRejectedValue(new HttpErrorResponse({ status: 0 }));
    await store.send(device, 'PUMP_PULSE', { durationMs: 100 });
    const pending = store.commands()[0];
    for (let i = 0; i < 51; i++) {
      store.mergeCommand({ ...pending, commandId: 'completed-' + i, status: 'REJECTED' });
    }
    expect(store.commands()).toHaveLength(51);
    expect(store.pending(device.deviceKey)).toBe(true);
    expect(store.commands()).toContain(pending);
  });
  it('descarta dados da sessão após logout',()=>{
    user.set(null);TestBed.tick();expect(store.devices()).toEqual([]);expect(store.commands()).toEqual([]);expect(live.stop).toHaveBeenCalled();
  });
});
