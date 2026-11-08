# Cidade Viva — frontend

Angular integrado ao backend local ASP.NET Core: autenticação, dashboard, energia, hidráulica, mobilidade, dispositivos, alertas e histórico.

## Executar localmente

Pré-requisitos validados: Node 26.13 e npm 11.20. Inicie a API do repositório irmão em `http://127.0.0.1:5080`, PostgreSQL, MQTT e o simulador conforme o README do backend.

```powershell
cd frontend
npm ci
npm start -- --port 4200
```

Abra `http://127.0.0.1:4200`. Use os usuários locais `viewer` ou `operator` e as senhas configuradas no ambiente do backend (`Bootstrap__viewer__Password` / `Bootstrap__operator__Password`). Nenhuma senha deve ser copiada para o frontend. O token fica em memória; recarregar encerra a sessão local.

O proxy de desenvolvimento encaminha `/api`, `/hubs` (WebSocket) e `/openapi` à API. O frontend não se conecta diretamente ao MQTT. Para uma publicação futura, configurar proxy reverso na mesma origem; não usar `ng serve` como servidor de produção. O meta `api-base-url` permite definir outra base explicitamente, com CORS configurado no servidor.

## Validação

```powershell
cd frontend
npm run build
npm test -- --watch=false
```

15 testes automatizados e build de produção aprovados. QA manual com API/MQTT/PostgreSQL reais e dispositivos simulados registrado em [evidências](docs/execution/002-EVIDENCIAS-FRONTEND.md).

## Limites do recorte

SIMULAÇÃO permanece identificada. Comandos aguardam ACK; `202` não confirma atuação. A bomba respeita boia, modo e limites, com proteções definitivas no firmware. Configuração remota continua `NOT_SENT`. Sem fase reportada, travessia fica bloqueada; não há geração solar ou vazão fictícias.

A API não oferece listagem global de comandos/eventos. O histórico apresenta leituras paginadas, comandos da sessão e consulta persistida por UUID. A integração com placas físicas e a validação em projetor continuam pendentes.

Veja [arquitetura](ARCHITECTURE.md), [SDD 002](docs/sdd/002-frontend-integrado/spec.md) e [tarefas](docs/sdd/001-mvp/tasks.md). Sem commit, push ou deploy nesta entrega.
