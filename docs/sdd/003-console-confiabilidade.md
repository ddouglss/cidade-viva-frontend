# Console v1.2 — confiabilidade inicial

FE2-001, FE2-005, FE2-006 e FE2-019. Validar o MVP local e preparar o estado compartilhado para a cidade 2D. Usar os contratos existentes e os estados reportados pela API.

- Uma notificação de atualização recebida durante snapshot em andamento deve gerar nova consulta ao concluir. Agrupar notificações para evitar consultas simultâneas.
- Aplicar timeout de transporte de 10 segundos às consultas de snapshot/comando e à solicitação de comando. Falha de transporte no POST mantém o UUID e o estado indeterminado. O estado TIMED_OUT de execução continua vindo do backend.
- Se a consulta de um comando indeterminado retornar 404, manter o bloqueio e oferecer consulta manual do mesmo UUID. Pausar a consulta automática desse UUID. A ausência momentânea do registro não comprova que o POST falhou.
- Preservar todos os comandos em andamento ao limitar a lista de concluídos. Dar visibilidade aos pendentes antes da trilha de concluídos.

Aceite: login pelos dois perfis e leitura via proxy, Swagger e negociação SignalR. Regressões para snapshot concorrente, retenção de pendentes e POST ambíguo com 404 seguido de resultado persistido. Nenhum reenvio automático.

Evidência em 09/11/2026: PostgreSQL e Mosquitto healthy. API compilada e iniciada na porta 5080. Angular na porta 4200. Login e consulta de dois dispositivos para viewer e operator via proxy. Readiness, OpenAPI e Swagger HTTP 200. WebSocket SignalR autenticado via proxy conectado com o cliente oficial. Build Angular aprovado e 18 testes em quatro arquivos. A regressão de reconexão exercita a callback SignalR no store e a leitura subsequente. Interrupção e retorno da API no navegador e atuação em placa física ficam para validação própria.
