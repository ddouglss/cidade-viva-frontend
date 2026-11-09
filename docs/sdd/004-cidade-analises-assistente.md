# Cidade, análise e assistente — primeiro recorte v1.2

FE-103/104/105/114 e AI-001/002/003/005/006. Exibir planta esquemática SVG por setor e seleção equivalente por botão. O vínculo visual aponta para o controlador conhecido no snapshot compartilhado. Solar é um setor independente sem leitura. A seleção apresenta origem, qualidade, estado e acesso à tela operacional. A geometria é ilustrativa.

Análise usa REST de telemetria existente. Selecionar métrica, período e origem. Mostrar pontos numéricos válidos da amostra mais recente, unidade, quantidade, intervalo e mínimo/média/máximo da amostra. Separar origens e mostrar tabela equivalente. Sem agregação do período completo, projeção ou preenchimento de lacunas.

Assistente contextual usa disponibilidade e chat da API backend, com uma pergunta por chamada. Exibir fontes do snapshot, erros e estado desabilitado. Sugestões são texto para revisão humana. Preservar sessão autenticada e proteções dos controles existentes.

Em 09/11/2026, build aprovado e 18 testes existentes passaram. A prévia isolada em 4201 usou API 5083, PostgreSQL e MQTT locais. QA com viewer verificou seleção por teclado, contexto de irrigação, amostra de 200 leituras simuladas já persistidas e estado vazio para origem física. Desktop e viewport de 390 px revisados, sem overflow horizontal ou erros de console observados. Evidência em [dashboard v1.2](../evidence/dashboard-v12.png).

O mapa representa setores. Inventário e inspeção individual de ativos, zoom e camadas, 3D e workflow de melhorias são recortes posteriores. O gráfico representa a amostra do histórico, com estatística calculada no navegador. Consultas ao Gemini dependem da configuração do backend.
