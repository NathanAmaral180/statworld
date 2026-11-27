# Script: quem somos e onde moramos (Censo 2022, tema Demografia)

## O que faz
Busca no IBGE (Sidra), para o **Brasil**, os **27 estados** e os **5.570 municípios**:

| Assunto | Tabela | O que vem |
|---|---|---|
| Cor ou raça | 9605 | Branca, Preta, Amarela, Parda, Indígena (termos e ordem do IBGE) |
| Pessoas indígenas | 9718 | Total, em terras indígenas e fora delas |
| Pessoas quilombolas | 9578 | Total, em territórios quilombolas e fora deles |
| Domicílios | 4712 | Domicílios ocupados, moradores e média de moradores por domicílio |
| Urbana × rural | 9923 | População em área urbana e rural |

No Sidra, "-" é **zero** e "X", ".." e "..." são **sem dado**. O script respeita essa diferença: um município sem pessoas indígenas recenseadas tem zero, não "sem dado".

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/demografia-censo/baixar.mjs
```

Demora alguns minutos (os municípios vêm estado por estado).

## O que ele cria
- `dados/demografia/brasil-estados-censo.json`: Brasil (`BR`) e estados (sigla).
- `dados/demografia/brasil-municipios-censo.json`: municípios (código do IBGE).

## Conferido (27 nov 2026)
Brasil: parda 92.083.286, branca 88.252.121, indígenas 1.694.836, quilombolas 1.330.186, população urbana 177.508.417. Os números batem com o IBGE.

## Quando rodar de novo
Só no próximo Censo, ou se o IBGE revisar as tabelas.

## Se der erro
"O IBGE não respondeu": o Sidra está lento. Tente mais tarde.
