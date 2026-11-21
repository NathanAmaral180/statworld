# Script: pecuária por estado (Agro)

## O que faz
Baixa o valor da produção da pecuária em cada estado, produto por produto, e junta duas fontes:

| Produto | Fonte | Por quê |
|---|---|---|
| Leite, ovos, ovos de codorna, mel, lã, casulos do bicho-da-seda | **IBGE**, Pesquisa da Pecuária Municipal (tabela 74 do Sidra) | É a mesma família de pesquisas das lavouras; traz valor e quantidade |
| Bovinos, suínos, frango | **MAPA**, Valor Bruto da Produção (VBP), planilha "Regional por UF" | O IBGE não calcula o valor em reais da produção de carne |

## De onde vêm os dados
- IBGE: https://sidra.ibge.gov.br/tabela/74
- MAPA: https://www.gov.br/agricultura/pt-br/assuntos/politica-agricola/valor-bruto-da-producao-agropecuaria-vbp

## Cuidados (importante)
- **Do MAPA usamos os valores "nominais"**, sem correção pela inflação, para ficarem comparáveis aos do IBGE. A planilha também tem um bloco corrigido pela inflação, que nós **não** usamos.
- Usamos um **ano fechado** (o mesmo ano das lavouras), e não a estimativa do ano corrente.
- No MAPA, quando aparece "-", o MAPA **não estimou** aquele estado. O site mostra **"sem dado"**, e não zero.
- No IBGE, "-" quer dizer **não produz** (zero).
- IBGE e MAPA usam preços e métodos diferentes. O site avisa isso na nota abaixo do mapa.
- Quantidades: o leite é convertido para litros, os ovos para dúzias, e o mel, a lã e os casulos para toneladas. Para carne não há quantidade (o MAPA só traz o valor).

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/pecuaria-estados/baixar.mjs
```

Deve aparecer `Pronto: 9 produtos da pecuária…` e o valor de cada um.

## O que ele cria
`dados/agro/brasil-estados-pecuaria.json`. Não edite à mão.

## Quando rodar de novo
- **Uma vez por ano**, junto com o script das lavouras (`lavouras-estados`), trocando o `ANO` no topo dos **dois** scripts. O site recusa anos diferentes entre lavouras e pecuária.
- O MAPA publica uma planilha nova **todo mês**. Para atualizar, troque no topo do arquivo `baixar.mjs`:
  - `ARQUIVO_VBP`: o nome do arquivo "Regional por UF" mais recente na página do MAPA (ex.: `202611VBPREGIONAL.xlsx`);
  - `VERSAO_VBP`: o mês desse arquivo (ex.: `novembro de 2026`).

## Se der erro
- "Produto novo na tabela 74": o IBGE incluiu um produto. Peça ajuda ao Claude.
- "não tem a aba" / "não achei o bloco de valores nominais" / "esperava 27 estados": o MAPA mudou o formato da planilha. Peça ajuda ao Claude.
- "O site respondeu com erro 404": o nome do arquivo do MAPA mudou. Confira o nome na página do MAPA.
