# Rodada 4 — Economia, molde por país (Claude Design)

Arquivos: `StatWorld Economia telas (offline).html` (versão 1) e **`StatWorld Economia telas (offline) v2.html` (versão 2, vale esta)**. Abrir no navegador.
A versão 2 só muda a navegação (ver abaixo); as telas são as mesmas. Telas em claro/escuro, desktop (1440) e celular (390).
**Todos os números das telas são de exemplo** (selo "EXEMPLO"): não podem ir para o site. Cada número real vem de script + `dados/`.

## O que vale em todas as abas
- **Faixa "X hoje"** (no site fica ABAIXO do mapa e do ranking, não no topo como no design: decisão do dono) de cada aba (ex.: "Impostos hoje", "Trabalho hoje"): 3 números nacionais mais recentes, cada um com selo de frequência (anual, mensal, semanal, trimestral, por reunião, ao vivo, diário), fonte e data.
- **Navegação em dois níveis (versão 2)**: nível 1 = grupos (Visão geral · Setores · Pessoas e governo · Mundo e mercado); nível 2 = abas do grupo ativo, logo abaixo (a Visão geral não tem nível 2). Nunca quebra linha. No computador, o que não cabe vai para "Mais (n)" (a aba ativa nunca vai); no celular, o nível 1 usa rótulos curtos (Pessoas, Mundo) e o nível 2 rola na horizontal, já na aba ativa. (A versão 1 tinha uma barra só, com rótulos de grupo acima.)
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
