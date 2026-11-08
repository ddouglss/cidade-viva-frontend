# SDD 001 — Angular: dashboard e controle da Cidade Viva

**Estado:** PROPOSTO | **Dependências:** endpoints e eventos v1 do backend; fixtures compartilhadas.

## Requisitos
- **FE-001:** layout responsivo de demonstração em notebook/projetor e celular, navegação entre Dashboard/Energia/Água/Mobilidade/Dispositivos/Alertas/Histórico.
- **FE-002:** obter snapshot da API, associar SignalR e atualizar sem recarregamento; indicar offline/reconectando/stale.
- **FE-003:** listar `esp32-energy` e `esp32-water`, firmware, último contato e status dos sensores/atuadores.
- **FE-004:** comando manual iluminacão principal só para operador; exibir `PENDING` e resultado efetivo por ACK.
- **FE-005:** água: exibir nível, modo automático/manual, umidade com origem REAL/SIMULADA e qualidade; não permitir falsa leitura de solo.
- **FE-006:** comando `PUMP_PULSE` até máximo permitido, não ignorar boia/erro; mensagem clara de rejeição.
- **FE-007:** mobilidade: estados seguros dos dois sinaleiros e botão de travessia; cancela como feature flag enquanto modelo não aprovado.
- **FE-008:** energia solar: exibir circuito independente e quatro postes; ocultar dado de carga/potência solar não instrumentado.
- **FE-009:** histórico de eventos e comandos com status, motivo e horário local acompanhado de timestamp UTC no dado.
- **FE-010:** acessibilidade e rótulos, sem depender só de cores; auth e roles do backend.

## Cenários de aceite
1. Dado dispositivo offline, dashboard mostra offline e última atualização; não marca GPIO como confirmado.
2. Dado sensor simulado, tela exibe `SIMULAÇÃO` visivelmente.
3. Dado POST comando que retorna 202, UI mostra aguardando; só após ACK indica aplicado ou recusado.
4. Dado rejeição `RESERVOIR_LOW`, UI mostra explicação sem tentar ligar a bomba automaticamente.
5. Dado reconexão SignalR, UI busca snapshot REST e remove estado obsoleto.
6. Dado `viewer`, controles de escrita não ficam acessíveis nem executam solicitação.

## Fora de escopo
IA generativa, captura de câmeras, aplicativos nativos, layout 3D obrigatório, emissão de energia solar fictícia e manipulação direta de hardware.
