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
- `lavouras-estados/`: agro, lavouras por estado e produto
- `pecuaria-estados/`: agro, pecuária (IBGE + MAPA)
- `icones-agro/`: ícones e cores dos produtos, vindos do Claude Design
- `icones-industria/`: ícones e cores dos setores da indústria, vindos do Claude Design
- `mundo-mapa/`: mapa-múndi da página inicial
- `brasil-agora/`: faixa "Agora" (Banco Central)
- `mundo-temas/`: um número do mundo por tema (Banco Mundial)
- `eua-mapa-estados/`: contorno dos estados dos EUA
- `eua-pib-estados/`: PIB por estado dos EUA
- `eua-agro-estados/`: agro por estado e produto dos EUA (USDA)
