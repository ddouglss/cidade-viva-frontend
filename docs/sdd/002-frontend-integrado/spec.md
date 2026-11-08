# SDD 002 — frontend integrado ao backend local

Execução autorizada pelo usuário em 08/11/2026: Codex assume frontend neste chat. Preservar o scaffold Angular existente e os documentos compartilhados. Não modificar backend ou firmware.

Fonte de contratos: `../cidade-viva-backend/docs/api/MVP-LOCAL.md` e OpenAPI em `http://127.0.0.1:5080/openapi/v1.json`. Não criar endpoints ausentes.

## Recorte FE-001 a FE-010

- Login local username/password; token opaco só em memória, identidade via /auth/me, guard de rotas, logout e expiração; nunca credencial padrão no bundle. Após recarregar a página, autenticar novamente.
- Layout responsivo operacional com navegação Dashboard, Energia, Hidráulica, Mobilidade, Dispositivos, Alertas e Histórico. Sem tela de marketing, 3D ou potência solar inventada.
- Cliente REST tipado, erros acionáveis, loading/empty/error, origem e qualidade explícitas. Desconexão não apaga última leitura nem a apresenta como atual.
- Snapshot REST ao entrar e após reconectar SignalR; notificações geram ressincronização e polling limitado atualiza TTL e comandos pendentes. Uma conexão por sessão, listeners únicos e cleanup no logout.
- online/reportedOnline/isStale/origin/quality conforme backend; SIMULAÇÃO visível por leitura/dispositivo. Sem medição => “Sem leitura”; estado desconhecido nunca vira desligado/zero.
- Operador solicita ações previstas; viewer não escreve. Bloquear pulso com boia baixa/indeterminada, offline/stale/quality inválida, modo diferente de MANUAL e durante comando em andamento. Backend/firmware continuam autoridade final. Duração limitada à regra exposta pelo servidor.
- Estados solicitando/PENDING/PUBLISHED/RECEIVED nunca são atuação confirmada; APPLIED significa aplicado no controlador, não vazão comprovada. Rejeição, expiração e timeout aparecem com motivo. Falha ambígua no POST preserva commandId e só permite consultar, sem reenviar automaticamente.
- Solar independente: quatro postes, sem potência/carga ou estado elétrico inventado. Cancela permanece indisponível. Semáforos mostram somente fase efetivamente reportada; sem campo de fase, mostrar ausência de telemetria.
- Alertas mostram causa ativa e reconhecimento separados. Reconhecer não apaga causa. Configurações NOT_SENT continuam descritas como não enviadas à placa.
- Histórico usa telemetria paginada e filtros da API; comandos desta sessão identificados como tal e consulta persistida por commandId. Não inventar endpoint para listagem global de comandos/eventos inexistente.
- Datas locais com ISO UTC disponível em title; HTML semântico, foco visível, teclado, contraste e adaptação 320px até desktop.

## Aceite

Build e testes automatizados; validação em navegador desktop/mobile; login real, snapshot simulado, permissão viewer, solicitação/ACK, alertas, histórico e erros. Separar QA manual de testes automatizados. Não marcar tarefa composta completa sem evidências. Sem commit, push ou deploy.
