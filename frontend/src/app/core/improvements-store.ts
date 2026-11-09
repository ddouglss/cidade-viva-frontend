import { computed, Injectable, signal } from '@angular/core';

export type ImprovementStatus =
  | 'IDEA'
  | 'TRIAGE'
  | 'APPROVED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'VALIDATING'
  | 'DONE'
  | 'REJECTED';

export type ImprovementSource = 'MANUAL' | 'RULE' | 'GEMINI';
export type ImprovementPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ImprovementActivity {
  at: string;
  actor: string;
  action: string;
}

export interface ImprovementItem {
  id: string;
  title: string;
  problem: string;
  hypothesis: string;
  zoneId: string;
  assetId?: string;
  deviceKey?: 'esp32-energy' | 'esp32-water';
  source: ImprovementSource;
  status: ImprovementStatus;
  priority: ImprovementPriority;
  impact: string;
  effort: 'BAIXO' | 'MÉDIO' | 'ALTO';
  baselineMetric: string;
  validationPlan: string;
  provenanceNote: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  activities: ImprovementActivity[];
}

export const IMPROVEMENT_STATUS_LABELS: Record<ImprovementStatus, string> = {
  IDEA: 'Ideia / Rascunho',
  TRIAGE: 'Em Triagem',
  APPROVED: 'Aprovada',
  PLANNED: 'Planejada',
  IN_PROGRESS: 'Em Execução',
  VALIDATING: 'Validando Medição',
  DONE: 'Concluída',
  REJECTED: 'Rejeitada'
};

export const IMPROVEMENT_SOURCE_LABELS: Record<ImprovementSource, string> = {
  MANUAL: 'Observação Operacional',
  RULE: 'Regra / Alerta',
  GEMINI: 'Sugestão Assistente Gemini'
};

const STORAGE_KEY = 'cv_improvements_v1_2';

const INITIAL_IMPROVEMENTS: ImprovementItem[] = [
  {
    id: 'IMP-101',
    title: 'Ajustar histerese crepuscular do ramal principal de iluminação',
    problem: 'Oscilações rápidas de iluminância próximas ao limiar em lx causam comutações repetidas dos dois postes principais.',
    hypothesis: 'Aplicar banda morta (histerese) e janela mínima de estabilidade no firmware reduz acionamentos espúrios sem atrasar o acendimento noturno.',
    zoneId: 'residential',
    assetId: 'streetlight-main-01',
    deviceKey: 'esp32-energy',
    source: 'GEMINI',
    status: 'VALIDATING',
    priority: 'HIGH',
    impact: 'Estabilidade de iluminação e menor desgaste de chaveamento',
    effort: 'BAIXO',
    baselineMetric: 'illuminanceLux (Amostra de telemetria · validar contagem de transições)',
    validationPlan: 'Comparar número de comutações de mainLightOn em janela de 1h sob variação controlada de lux.',
    provenanceNote: 'Baseado nas leituras de illuminanceLux reportadas pelo esp32-energy.',
    owner: 'Equipe Energia',
    createdAt: '2026-11-08T14:20:00.000Z',
    updatedAt: '2026-11-09T10:15:00.000Z',
    activities: [
      { at: '2026-11-08T14:20:00.000Z', actor: 'gemini-assistant', action: 'Rascunho sugerido a partir da análise de illuminanceLux' },
      { at: '2026-11-09T10:15:00.000Z', actor: 'operator', action: 'Movido para Validando Medição' }
    ]
  },
  {
    id: 'IMP-102',
    title: 'Procedimento guiado de reposição hídrica após bloqueio por boia baixa',
    problem: 'Pulsos manuais de irrigação são recusados com RESERVOIR_LOW quando o retorno da bandeja ainda não estabilizou o nível.',
    hypothesis: 'Exibir checklist de inspeção de nível e tempo de retorno antes de habilitar nova solicitação evita tentativas repetidas bloqueadas.',
    zoneId: 'water',
    assetId: 'reservoir-tank-01',
    deviceKey: 'esp32-water',
    source: 'RULE',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    impact: 'Redução de comandos recusados (REJECTED) por RESERVOIR_LOW',
    effort: 'BAIXO',
    baselineMetric: 'Alertas RESERVOIR_LOW + taxa de recusa PUMP_PULSE',
    validationPlan: 'Confirmar que o intertravamento permanece no controlador e medir redução de recusas por operador.',
    provenanceNote: 'Proteção física local preservada integralmente no esp32-water.',
    owner: 'Equipe Hidráulica',
    createdAt: '2026-11-08T16:00:00.000Z',
    updatedAt: '2026-11-09T11:30:00.000Z',
    activities: [
      { at: '2026-11-08T16:00:00.000Z', actor: 'operator', action: 'Registrada a partir de alerta RESERVOIR_LOW' },
      { at: '2026-11-09T11:30:00.000Z', actor: 'operator', action: 'Aprovada e iniciada implementação no console' }
    ]
  },
  {
    id: 'IMP-103',
    title: 'Instrumentação futura INA219 para medição elétrica do circuito solar',
    problem: 'Os 4 postes solares operam em circuito autônomo isolado, sem telemetria de tensão/corrente na plataforma.',
    hypothesis: 'Adicionar sensor INA219 em barramento de teste dedicado permitirá comparar geração solar real sem números estimados.',
    zoneId: 'solar',
    assetId: 'solar-poles-01-04',
    source: 'MANUAL',
    status: 'IDEA',
    priority: 'MEDIUM',
    impact: 'Transparência energética e dados medidos reais (PHYSICAL_SENSOR)',
    effort: 'ALTO',
    baselineMetric: 'Atualmente: Não instrumentado (sem baseline numérico)',
    validationPlan: 'Homologar leitura de busVoltageV e currentMa antes de exibir KPIs de potência.',
    provenanceNote: 'Enquanto não instrumentado, a interface mantém indicação explícita de circuito autônomo.',
    owner: 'Laboratório Cidade Viva',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedAt: '2026-11-09T09:00:00.000Z',
    activities: [
      { at: '2026-11-09T09:00:00.000Z', actor: 'operator', action: 'Proposta cadastrada no backlog de evolução' }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class ImprovementsStore {
  readonly items = signal<ImprovementItem[]>(this.load());
  readonly selectedAssetDraft = signal<{ assetId?: string; deviceKey?: 'esp32-energy' | 'esp32-water'; zoneId?: string; suggestionText?: string } | null>(null);

  readonly counts = computed(() => {
    const list = this.items();
    return {
      total: list.length,
      ideas: list.filter(i => i.status === 'IDEA' || i.status === 'TRIAGE').length,
      active: list.filter(i => ['APPROVED', 'PLANNED', 'IN_PROGRESS', 'VALIDATING'].includes(i.status)).length,
      done: list.filter(i => i.status === 'DONE').length,
      fromGemini: list.filter(i => i.source === 'GEMINI').length
    };
  });

  private load(): ImprovementItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback para seed padrão em ambiente de teste/restrito
    }
    return INITIAL_IMPROVEMENTS;
  }

  private save(items: ImprovementItem[]) {
    this.items.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignora erro de quota
    }
  }

  create(input: {
    title: string;
    problem: string;
    hypothesis: string;
    zoneId: string;
    assetId?: string;
    deviceKey?: 'esp32-energy' | 'esp32-water';
    source: ImprovementSource;
    priority: ImprovementPriority;
    impact: string;
    effort: 'BAIXO' | 'MÉDIO' | 'ALTO';
    baselineMetric: string;
    validationPlan: string;
    provenanceNote: string;
    actor: string;
  }): ImprovementItem {
    const now = new Date().toISOString();
    const nextNum = 101 + this.items().length;
    const item: ImprovementItem = {
      id: `IMP-${nextNum}`,
      title: input.title.trim(),
      problem: input.problem.trim(),
      hypothesis: input.hypothesis.trim(),
      zoneId: input.zoneId,
      assetId: input.assetId,
      deviceKey: input.deviceKey,
      source: input.source,
      status: 'IDEA',
      priority: input.priority,
      impact: input.impact.trim() || 'Melhoria operacional verificável',
      effort: input.effort,
      baselineMetric: input.baselineMetric.trim() || 'Telemetria do dispositivo / alertas registrados',
      validationPlan: input.validationPlan.trim() || 'Comparar indicadores antes e depois com mesma origem de dado.',
      provenanceNote: input.provenanceNote.trim() || 'Criada sob revisão humana; não dispara comandos MQTT.',
      owner: input.actor || 'Operador',
      createdAt: now,
      updatedAt: now,
      activities: [
        {
          at: now,
          actor: input.actor || 'operator',
          action: input.source === 'GEMINI'
            ? 'Rascunho criado a partir de sugestão do Assistente Gemini com confirmação humana'
            : 'Proposta de melhoria registrada'
        }
      ]
    };
    this.save([item, ...this.items()]);
    return item;
  }

  transition(id: string, nextStatus: ImprovementStatus, actor: string) {
    const now = new Date().toISOString();
    const updated = this.items().map(item => {
      if (item.id !== id || item.status === nextStatus) return item;
      return {
        ...item,
        status: nextStatus,
        updatedAt: now,
        activities: [
          {
            at: now,
            actor,
            action: `Estado alterado de ${IMPROVEMENT_STATUS_LABELS[item.status]} para ${IMPROVEMENT_STATUS_LABELS[nextStatus]}`
          },
          ...item.activities
        ]
      };
    });
    this.save(updated);
  }
}
