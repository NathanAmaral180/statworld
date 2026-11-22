# Rodada 4 — Economia, molde por país (Claude Design)

Arquivo: `StatWorld Economia telas (offline).html` (abrir no navegador). Telas em claro/escuro, desktop (1440) e celular (390).
**Todos os números das telas são de exemplo** (selo "EXEMPLO"): não podem ir para o site. Cada número real vem de script + `dados/`.

## O que vale em todas as abas
- **Faixa "X hoje"** no topo de cada aba (ex.: "Impostos hoje", "Trabalho hoje"): 3 números nacionais mais recentes, cada um com selo de frequência (anual, mensal, semanal, trimestral, por reunião, ao vivo, diário), fonte e data.
- **Barra de abas em grupos**: rótulo discreto acima de cada grupo; o rótulo do grupo ativo fica em tinta cheia. Uma linha só; no celular rola na horizontal e abre já posicionada na aba ativa.
- **Seletor de vistas** (botões tipo "Peso no PIB / PIB por pessoa…") com selo de frequência + fonte + data ao lado.
- Molde mapa + ficha + ranking igual ao já aprovado.

## Telas
1. **Visão geral** — 4ª medida "Impostos sobre produtos (% do PIB)", com a nota "PIB = valor adicionado + impostos sobre produtos… não é arrecadação" sob os botões e na ficha.
2. **Impostos** — mapa de impostos sobre produtos (% do PIB); ficha com composição do PIB (valor adicionado × impostos), média do país e diferença; faixa "Impostos hoje" com carga tributária (Tesouro) e arrecadação federal (Receita Federal).
3. **Trabalho e renda** — mapa do desemprego (PNAD Contínua, trimestral); ficha com renda média e empregos com carteira (Novo Caged, mensal); 2ª vista: séries de desemprego e renda com cursor.
4. **Preços e poder de compra** — inflação em 12 meses (IPCA) com faixa da meta; cesta básica por capital (DIEESE; capitais fora da pesquisa com hachura); salário mínimo em cestas.
5. **Comércio exterior** — mapa de exportações por estado (Comex Stat, US$); balança do ano no topo da lateral; vistas de principais produtos e parceiros.
6. **Dinheiro e juros** — painel de séries (dólar, Selic, bolsa, crédito) com selo "ao vivo"/"diário" e faixa do dia; série escolhida no gráfico grande.
7. **Contas públicas** — "de onde vem e para onde vai cada R$ 100" (quadradinhos); vistas de dívida bruta (série) e gasto por função (ranking).

## Diferenças do design em relação ao site (o site prevalece)
- O design mostra Indústria e Serviços como "em breve": no site as duas já estão no ar.
- O design usa 2023 e "9 sem dado" no crescimento: no site os dados são de 2024 e os 27 estados têm dado.
