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
- `populacao/`: população, crescimento, densidade e idade (Censo 2022 e estimativas do IBGE), Brasil, estados e municípios (tema Demografia)
- `demografia-censo/`: cor ou raça, indígenas, quilombolas, domicílios e urbana × rural (Censo 2022), Brasil, estados e municípios
- `demografia-series/`: pirâmides 1980–2070, nascimentos e mortes, esperança de vida, filhos por mulher (Projeções 2024 e Registro Civil) e migração entre estados
- `piramides-municipios/`: pirâmide etária (Censo 2022) de cada município de um estado, para a ficha do município
- `saude-vital/`: nascimentos, mortes por causa e padronizadas por idade, mortalidade infantil e materna (Ministério da Saúde, SIM e SINASC pelo TabNet), Brasil, estados e municípios
- `saude-rede/`: médicos, enfermeiros, leitos SUS, não SUS e UTI (CNES, mensal)
- `saude-planos/`: beneficiários de planos de saúde (ANS)
- `saude-pns/`: Pesquisa Nacional de Saúde 2019 (IBGE): autoavaliação, doenças crônicas, hábitos
- `lib/tabnet.mjs`: consulta ao TabNet (DATASUS e ANS), usado pelos scripts de saúde
- `ferrovias/`: traçado e situação das ferrovias (Ministério dos Transportes), tema Transporte e infraestrutura
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
