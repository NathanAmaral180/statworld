# Script: PIB dos estados dos EUA

## O que faz
Baixa do BEA (Bureau of Economic Analysis, o órgão oficial de contas econômicas dos EUA) o PIB de cada estado e a população, e calcula as **mesmas três medidas** do mapa do Brasil:

| Medida no site | Como é feita |
|---|---|
| **Peso no PIB** | **Cálculo nosso**: PIB do estado dividido pela soma dos 50 estados e do Distrito de Colúmbia. |
| **PIB por pessoa** | **Cálculo nosso**: PIB do estado dividido pela população estimada pelo BEA. |
| **Crescimento** | Variação do índice de volume do PIB real (já descontada a inflação) de um ano para o outro. |

## De onde vêm os dados
Página de downloads do BEA: https://apps.bea.gov/regional/downloadzip.htm
- `SAGDP.zip`: tabela SAGDP1 (PIB por estado: valor em dólares e índice de volume).
- `SAINC.zip`: tabela SAINC1 (população por estado).

Não precisa de cadastro nem de chave.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/eua-pib-estados/baixar.mjs
```

O script baixa uns 30 MB, então demora um pouco. No fim, ele mostra uma **conferência**: a soma dos estados e o total do país segundo o BEA. A diferença entre os dois é pequena e normal, porque o total do país inclui atividades fora dos estados, como as forças armadas no exterior.

## O que ele cria
`dados/economia/eua-estados.json`. Não edite à mão.

## Quando rodar de novo (uma vez por ano)
O BEA publica o ano novo por estado no fim de setembro.
1. No topo de `baixar.mjs`, troque `ANO`.
2. Rode o comando acima.

A data de divulgação é lida do próprio arquivo do BEA ("Last updated").

## Se der erro
- "não tem o ano": o BEA ainda não publicou esse ano. Volte o `ANO`.
- "Faltou o estado" ou "Não achei a tabela": o BEA mudou o formato. Peça ajuda ao Claude.
- Se aparecer "valores ficaram como sem dado", o site vai mostrar esses estados hachurados. Isso não é erro, mas vale conferir.
