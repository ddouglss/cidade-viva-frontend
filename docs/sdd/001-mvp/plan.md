# Plano — SDD 001 Angular

## Implementação
1. Fixar versão Angular/Node e lint/test; criar app standalone com roteamento, layout e tema acessível.
2. Implementar cliente REST tipado e auth/roles; fixtures em ambiente de desenvolvimento.
3. Criar camada de estado de dispositivos e hub SignalR; snapshot REST para bootstrap/reconexão.
4. Criar páginas por vertical com estado `loading/empty/error/stale`.
5. Criar componentes `CommandStatus`, `TelemetrySource`, `DeviceBadge`, `SensorMetric`, `SafetyNotice`.
6. Implementar controles com pré-validação visual, mas autoridade final no backend e firmware; exibir recusas.
7. Criar testes unitários e e2e com API mock e broker simulado em integração real.

## Regras visuais
Estado solar autônomo diferente do principal; umidade `SIMULADA` distinguível; `PUMP_PULSE` com duração permitida pelo servidor; botões desabilitados em modo viewer; cancelar repetição enquanto `PENDING`.

## Antiobjetivos
Não desenhar toda maquete em 3D antes do MVP, não replicar regras de segurança física no Angular como única proteção, não considerar evento SignalR como única fonte.
