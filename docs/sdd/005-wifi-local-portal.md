# SDD 005 — Configuração Wi-Fi após instalação

## Problema e objetivo
O backend hospedado no Coolify não alcança a porta COM nem a rede local do notebook do operador. A tela de Wi-Fi em produção prometia detectar e configurar placas via servidor, mas não podia cumprir esse fluxo. O operador precisa trocar o Wi-Fi dos ESP32 já instalados na maquete.

## Requisito e decisão
- Em produção, orientar o operador a conectar o notebook/celular ao AP WPA2 da placa (`CidadeViva-Energy` ou `CidadeViva-Water`) enquanto ela estiver ligada e abrir o portal local em `http://192.168.4.1`. O AP deve permanecer ativo também quando a placa estiver conectada ao Wi-Fi normal, como no perfil de bancada anterior.
- O portal pertence ao firmware e recebe somente SSID, senha Wi-Fi e IPv4 privado da ponte MQTT. A senha MQTT permanece na placa.
- A senha do AP é única por placa e deve ser registrada antes da instalação física.
- A página hospedada não tenta usar a COM do servidor nem enviar senha Wi-Fi à API de produção. O fluxo anterior da API fica disponível somente no ambiente local de desenvolvimento.
- O notebook que executa a ponte deve estar acessível na mesma rede; redes com isolamento de clientes ou portal cativo podem exigir hotspot próprio de 2,4 GHz.

## Aceite
- Produção mostra passos e link do portal local, sem formulário de envio ao servidor.
- Desenvolvimento local mantém o fluxo anterior para bancada.
- Build Angular conclui sem erro. Teste em AP real permanece condicionado a conexão física da placa.
