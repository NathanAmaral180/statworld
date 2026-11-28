# Script: população e idade (tema Demografia)

## O que faz
Busca no IBGE os números de população do **Brasil**, dos **27 estados** e dos **5.570 municípios**:

| Medida | De onde vem |
|---|---|
| População (Censo 2022) | Tabela 4709 do Sidra |
| Variação desde 2010 e crescimento por ano (2010–2022) | Tabela 4709 (publicado pelo IBGE) |
| Área e densidade (habitantes por km²) | Tabela 4714 |
| População estimada nos dois anos mais recentes (hoje 2025 e 2026) e o crescimento entre eles | Tabela 6579. O crescimento é **cálculo nosso** |
| Pirâmide etária (homens e mulheres em 21 grupos de 5 anos) | Tabela 9514 (Censo 2022) |
| % de crianças (0–14), % de idosos (60+ e 65+), índice de envelhecimento (65+ para cada 100 de 0 a 14, como o IBGE), homens para cada 100 mulheres | **Cálculo nosso** com a pirâmide |
| Idade mediana | **Cálculo nosso, aproximado** (a idade está em grupos de 5 anos) |

No Sidra, "-" quer dizer **zero** e "X", ".." e "..." querem dizer **sem dado**. O script respeita essa diferença.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/populacao/baixar.mjs
```

Demora alguns minutos, porque pede os municípios estado por estado. No fim deve aparecer: `Pronto: Brasil 203080756 pessoas no Censo 2022, ... estimadas em 2026; 5570 municípios.`

## O que ele cria
- `dados/demografia/brasil-estados.json`: Brasil (chave `BR`) e estados (chave = sigla), com as pirâmides completas.
- `dados/demografia/brasil-municipios.json`: todos os municípios (chave = código do IBGE), com as medidas de idade.

## Quando rodar de novo
- **Estimativas:** o IBGE divulga uma nova todo ano, perto de agosto. O script pega sozinho os dois anos mais recentes.
- **Censo:** só muda no próximo Censo.

## Conferido (26 nov 2026)
População do Brasil no Censo 2022: 203.080.756. São Paulo: 44.411.238. Os dois batem com o IBGE.

## Se der erro
- "O IBGE não respondeu": o Sidra está lento ou fora do ar. Tente mais tarde.
- "Vieram só N municípios": alguma consulta voltou incompleta. Rode de novo.
