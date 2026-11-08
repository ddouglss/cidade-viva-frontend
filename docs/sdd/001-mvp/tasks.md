# Tarefas — SDD 001 Angular

- [x] F001 Criar app Angular, estruturar pastas por feature, rotas e design system simples.
- [x] F002 Criar tipos do contrato v1 e API client; centralizar erros/autorizações.
- [x] F003 Desenvolver dashboard com estado online/offline e cards por zona.
- [ ] F004 Implementar SignalR, reconexão e ressincronização do snapshot REST.
- [x] F005 Implementar página Energia, distinção circuito solar/ramal principal, lux real.
- [x] F006 Implementar página Hidráulica, boia, AUTO/MANUAL e origem física/simulada.
- [ ] F007 Implementar página Mobilidade e estados seguros dos sinaleiros.
- [ ] F008 Implementar controle de iluminação/pulso com progresso 202→ACK, rejeição e timeout.
- [ ] F009 Implementar dispositivos, alertas e histórico com paginação/filtros.
- [ ] F010 Criar testes de componentes/serviços e e2e dos cenários offline, ACK recusado e SIMULAÇÃO.
- [ ] F011 Revisar contraste, teclado, rótulos e projetor; registrar capturas de evidência.

**DoD:** controle e telemetria simulados funcionando com backend real; nenhuma execução falsa indicada.

## Estado da execução local — 08/11/2026

F005 usa o valor de lux efetivamente recebido, hoje SIMULATED_INPUT; leitura física ainda não foi homologada. F006 implementa ambos os modos e exibe a origem recebida; QA local usou sensores simulados.

- F004 implementado; conexão inicial e atualizações observadas. Falta QA interrompendo a API para validar reconexão completa.
- F007 parcial: página pronta, ausência de fase explícita e travessia bloqueada; faltam fases efetivas no dispositivo/contrato e homologação física.
- F008 implementado com estados intermediários/terminais e bloqueios. APPLIED e REJECTED exercitados ponta a ponta; timeout/expiração não exercitados em navegador.
- F009 parcial: dispositivos, alertas com reconhecimento e leituras paginadas/filtros prontos. Comandos da sessão e consulta por UUID; listagem global de comandos/eventos depende de endpoint ausente.
- F010 parcial: 15 testes automatizados aprovados e QA manual de offline/ACK recusado/SIMULAÇÃO. Falta suíte E2E automatizada versionada.
- F011 parcial: HTML semântico, labels, foco visível, skip link e responsividade revisados; capturas desktop/mobile registradas. Projetor e auditoria formal de contraste/teclado ainda pendentes.

Detalhes e evidências: [execução 002](../../execution/002-EVIDENCIAS-FRONTEND.md).
