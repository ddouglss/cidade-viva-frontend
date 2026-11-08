# Arquitetura frontend

## Features e páginas
- `/dashboard`: panorama (energia, água, mobilidade, conectividade), planta esquemática simples.
- `/energia`: dois postes principais, lux e corrente/tensão **quando instrumentada**; quatro postes solares como módulo autônomo, status de carga só se medido.
- `/hidraulica`: estado da boia, bomba, origem da umidade, modo AUTO/MANUAL, solicitação de pulso limitado.
- `/mobilidade`: semáforos, botão de travessia e cancela **condicional**.
- `/dispositivos`: firmware, online/offline, última telemetria, erros.
- `/alertas` e `/historico`: causa, reconhecimento, trilha de comando, métricas.

## Organização
`src/app/core` (auth, api-client, signalr, error handling); `features/{dashboard,energy,water,mobility,devices,alerts,history}`; `shared` (tipos gerados do contrato, componentes, acessibilidade). Preferir lógica de estado em serviços/facades testáveis e componentes de apresentação finos.

## Modelo de estado UI
`IDLE → REQUESTED → PENDING → APPLIED | REJECTED | EXPIRED | TIMED_OUT`. Sem ACK, não declarar que bomba/semáforo executou. Snapshot REST ao carregar e após reconexão SignalR. `source` e `quality` sempre visíveis em leitura simulada ou desatualizada.

## Acessibilidade
Teclado, rótulos ARIA/HTML, contrastes, não depender exclusivamente da cor de LEDs, feedback de erro e bloqueio de comandos com descrição do motivo.
