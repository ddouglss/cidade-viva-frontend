# Subprojeto frontend — CidadeViva Dashboard (`cidade-viva-frontend`)

**Stack:** Angular + TypeScript, standalone components, services tipados, SignalR e cliente HTTP. Primeiro consumir API simulada e depois os dados físicos.

**SDD:** `docs/sdd/001-mvp/spec.md` → `docs/sdd/001-mvp/plan.md` → `docs/sdd/001-mvp/tasks.md`.

Sem confirmação otimista de atuação física. Diferenciar telemetria `PHYSICAL_SENSOR` vs `SIMULATED_INPUT` e mostrar dispositivos `offline/stale`. Contrato compartilhado sincronizado em `docs/shared/` a partir da raiz deste repositório.

## Responsabilidade deste repositório
- Prover o dashboard web responsivo (notebook/projetor e celular) para monitoramento e operação da maquete Cidade Viva nas verticais `/dashboard`, `/energia`, `/hidraulica`, `/mobilidade`, `/dispositivos`, `/alertas` e `/historico`.
- Consumir snapshots REST e eventos em tempo real via SignalR (`/hubs/city`) expostos pelo `cidade-viva-backend`, ressincronizando o snapshot REST a cada reconexão.
- Representar fielmente o ciclo de vida dos comandos (`IDLE → REQUESTED → PENDING → APPLIED | REJECTED | EXPIRED | TIMED_OUT`): após `202 Accepted`, exibir estado de aguardo até confirmação por ACK/telemetria, nunca indicando acionamento físico por estado otimista.
- Exibir de forma explícita e acessível a origem dos dados (`PHYSICAL_SENSOR` vs `SIMULATED_INPUT`), qualidade (`VALID`, `INVALID`, `STALE`, `UNSYNCHRONIZED_TIME`), estado `online/offline` dos dispositivos e isolamento do circuito solar autônomo (sem exibir métricas solares não instrumentadas).

## Relação com os outros dois repositórios
O projeto Cidade Viva está organizado em três repositórios públicos independentes (sem submodules, subtrees ou Git aninhado):
1. **`cidade-viva-frontend` (este repositório — `https://github.com/ddouglss/cidade-viva-frontend`):** aplicação Angular + TypeScript de visualização e comando operacional.
2. **`cidade-viva-backend` (`https://github.com/ddouglss/cidade-viva-backend`, antigo `cidade-viva-platform`):** API ASP.NET Core, PostgreSQL, integração MQTT e SignalR consumidos por este frontend.
3. **`cidade-viva-firmware` (`https://github.com/ddouglss/cidade-viva-firmware`):** firmwares C++/PlatformIO para `esp32-energy` e `esp32-water` que executam as regras locais de segurança física e publicam telemetria/ACK no broker MQTT consumido pelo backend.

Os documentos em `docs/shared/` são cópias sincronizadas de referência nos três repositórios; qualquer alteração de contrato exige revisão coordenada e sincronização antes da integração.

## Ordem de leitura recomendada
1. `AGENTS.md` — regras obrigatórias do projeto, divisão de papéis (Codex planeja/revisa; Antigravity executa) e critérios de PR.
2. `docs/shared/01-VISAO-ESCOPO.md` — visão do produto, escopo P0/P1, itens fora do MVP e condições de não aceite.
3. `docs/shared/02-CONTRATOS-MQTT-V1.md` e `docs/shared/03-REGRAS-INTEGRACAO.md` — contratos de eventos, semântica `origin`/`quality`, fluxo REST → MQTT → ACK → SignalR e regras de interface API ↔ tela.
4. `docs/shared/04-INVENTARIO-E-DECISOES-PENDENTES.md`, `docs/shared/05-ADRS.md`, `docs/shared/06-PLANO-VALIDACAO-END-TO-END.md` e `docs/shared/07-REFERENCIAS.md` (`docs/shared/08-ESPECIFICACAO-INTEGRADA-REFERENCIA-v1.0.md` é referência histórica v1.0).
5. `ARCHITECTURE.md` — organização de páginas/features, modelo de estado de UI e requisitos de acessibilidade.
6. `docs/sdd/001-mvp/spec.md` → `docs/sdd/001-mvp/plan.md` → `docs/sdd/001-mvp/tasks.md` — requisitos `FE-001` a `FE-010` e tarefas `F001` a `F011`.
7. `docs/execution/001-PACOTE-ANTIGRAVITY.md` e `docs/decisions/001-ORGANIZACAO-REPOSITORIOS-E-MAPA-DOCUMENTAL.md` — plano de entregas e registro de organização/rastreabilidade.

## Estado real de implementação
- **Estado atual (Entrega A):** repositório inicializado exclusivamente com a documentação arquitetural, contratos compartilhados sincronizados e especificações SDD.
- **Código:** nenhuma aplicação Angular foi gerada. Todas as tarefas `F001` a `F011` em `docs/sdd/001-mvp/tasks.md` permanecem pendentes (`[ ]`) até a conclusão e validação da fundação e dos contratos do backend.
