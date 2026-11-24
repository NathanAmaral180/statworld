# StatWorld · Painel de progresso

O painel agora fica no próprio site, na página **/admin** (com senha), junto com os números de visitas.

- Os dados do painel (etapas, % de cada uma, linha do tempo, o que falta) ficam em `src/config/progresso.json`.
- O % geral é calculado pela página: soma de peso × andamento ÷ soma dos pesos.
- Atualizar no fim de toda sessão.
