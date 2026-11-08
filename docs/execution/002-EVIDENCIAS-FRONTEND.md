# Evidências — frontend integrado

Execução local em 08/11/2026. Codex assumiu implementação por instrução do usuário. Escopo FE-001 a FE-010, com limites abaixo; fonte contratual: documentação da API do backend e SDD 002. Backend, firmware e cópias dos contratos compartilhados não foram alterados.

## Alterações

- `frontend/src/app/core`: HTTP tipado, autenticação em memória, guards/interceptor, SignalR e estado coordenado REST/eventos/polling.
- `frontend/src/app/shared`: layout responsivo, componentes de dispositivo, métricas e acompanhamento de comandos.
- `frontend/src/app/features`: login e sete áreas de operação.
- Configuração Angular, proxy local, estilos globais e dependência oficial SignalR com lockfile.
- Testes de autenticação, guard, bloqueios de comando, ausência de confirmação otimista, limpeza de sessão e falha de snapshot.
- README, SDD 002 e tarefas com limitações explícitas.

## Verificações executadas

`npm run build`: aprovado; bundle inicial 384,55 kB, transferência estimada 100,76 kB. `npm test -- --watch=false`: 4 arquivos, 15 testes aprovados. Sem aviso de orçamento no build. Node 26.13, npm 11.20; dependências instaladas com lockfile.

QA manual em navegador, com frontend 4200, API 5080, PostgreSQL e MQTT locais:

| Cenário | Resultado observado |
| --- | --- |
| Login operator e viewer | Snapshot real da API; viewer com comandos desabilitados e motivo visível |
| Iluminação ligar/desligar | Solicitação/PENDING sem mudar estado reportado; APPLIED após ACK e nova telemetria; estado final desligado |
| Bomba com reservatório baixo | Pulso bloqueado na UI |
| Mudança de nível entre snapshot e execução | ACK REJECTED/RESERVOIR_LOW mostrado com motivo; bomba permaneceu desligada, sem repetição automática |
| SIMULAÇÃO | Origem explícita no dashboard, dispositivos e histórico |
| Desconexão do simulador | Offline exibido, última leitura preservada; simulador reiniciado após teste |
| Mobilidade sem fase | Ausência de telemetria explícita e travessia desabilitada |
| Alerta de nível | Reconhecimento persistido; causa permaneceu ativa |
| Histórico | Filtro esp32-energy/illuminanceLux e página 2 com 20 registros |
| Responsividade | Desktop 1280, mobile 390 e 320; sem overflow horizontal no dashboard; menu abre e fecha ao navegar |

O cenário de recusa usou temporariamente telemetria sintética `SIMULATED_INPUT` com nível disponível enquanto o simulador mantinha a proteção de nível baixo. Não houve hardware ou atuação física. Mensagens e reconhecimento ficam como dados de teste no banco local.

Durante QA foi corrigida uma consulta prematura do comando antes de concluir o POST (404 transitório). Teste de regressão impede polling no estado REQUESTED. Também foi corrigida a concorrência de início/encerramento do hub e o descarte de consulta de comando de uma sessão anterior.

## Capturas

- [Dashboard desktop](../evidence/dashboard-desktop.png)
- [Dashboard mobile](../evidence/dashboard-mobile.png)
- [ACK recusado](../evidence/ack-recusado.png)

## Pendências e impactos

QA de navegador é manual, não uma suíte E2E automatizada versionada. Reconexão SignalR está implementada, mas interrupção/reinício da API não foi exercitada nesta rodada. Testes físicos das duas placas, fases dos sinaleiros e projetor permanecem pendentes. Sem endpoint global de comandos/eventos, FE-009 fica limitado a leituras, sessão e consulta por UUID. Configuração de irrigação continua NOT_SENT, conforme decisão existente do backend.

Sem alteração de contrato MQTT, pinos, energia, instalação ou lista de compras. Sem commit, push ou deploy.
