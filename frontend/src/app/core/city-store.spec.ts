import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
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
  it('descarta dados da sessão após logout',()=>{
    user.set(null);TestBed.tick();expect(store.devices()).toEqual([]);expect(store.commands()).toEqual([]);expect(live.stop).toHaveBeenCalled();
  });
});
