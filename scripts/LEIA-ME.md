# Pasta scripts/

Aqui ficam os programas que **buscam os dados nas fontes oficiais** (IBGE, Banco Central etc.) e salvam na pasta `dados/`.

## Regra
Todo script ganha um arquivo LEIA-ME em português simples dizendo:
1. O que ele busca e de onde (com link da fonte).
2. Como rodar (o comando exato).
3. Que arquivo ele cria em `dados/`.
4. O que fazer se der erro.

Scripts existentes:
- `mapa-estados/`: contorno dos estados do Brasil
- `pib-estados/`: PIB por estado do Brasil
- `mapa-municipios/`: contorno dos municípios de um estado (piloto: SP) e das regiões do IBGE
- `pib-municipios/`: PIB e PIB por pessoa dos municípios de um estado (piloto: SP)
- `atividade-estado/`: PIB mensal do estado (Seade) e índice de atividade do Banco Central (IBCR), piloto SP
- `comercio-municipios/`: exportações e importações por município (Comex Stat), piloto SP
- `caged-municipios/`: empregos com carteira por município, mês a mês no ano (Novo Caged), Brasil inteiro
- `bandeiras-municipios/`: bandeiras do estado e dos municípios (Wikidata + Wikimedia Commons, só licença livre), piloto SP
- `lavouras-estados/`: agro, lavouras por estado e produto
- `pecuaria-estados/`: agro, pecuária (IBGE + MAPA)
- `icones-agro/`: ícones e cores dos produtos, vindos do Claude Design
- `industria-estados/`: indústria por estado e setor (IBGE, PIA)
- `servicos-estados/`: serviços por estado e atividade (IBGE, Contas Regionais)
- `icones-industria/`: ícones e cores dos setores da indústria, vindos do Claude Design
- `icones-servicos/`: ícones e cores das atividades de serviços, vindos do Claude Design
- `mundo-mapa/`: mapa-múndi da página inicial
- `brasil-agora/`: faixa "Agora" (Banco Central)
- `mundo-temas/`: um número do mundo por tema (Banco Mundial)
- `eua-mapa-estados/`: contorno dos estados dos EUA
- `eua-pib-estados/`: PIB por estado dos EUA
- `eua-agro-estados/`: agro por estado e produto dos EUA (USDA)
