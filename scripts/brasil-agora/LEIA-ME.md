# Script: faixa "Agora" (Brasil)

## O que faz
Baixa do Banco Central os três números da faixa "Agora" da página inicial:

| Na página | Série do Banco Central | Frequência |
|---|---|---|
| Dólar comercial, venda (PTAX) | 1 | diária (dias úteis) |
| Selic, meta ao ano | 432 | muda nas reuniões do Copom |
| Inflação (IPCA) em 12 meses | 13522 (calculada pelo IBGE) | mensal |

Também calcula a variação: o dólar em relação ao dia anterior, a Selic desde a última mudança e o IPCA em relação ao mês anterior (em pontos percentuais).

## De onde vêm os dados
Sistema SGS do Banco Central: https://www3.bcb.gov.br/sgspub/ (consulta aberta, sem cadastro).

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/brasil-agora/baixar.mjs
```

## O que ele cria
`dados/agora/brasil.json`. Não edite à mão.

## Importante: com que frequência rodar
Esses números mudam todo dia (dólar) ou todo mês (IPCA). O site **só mostra o que foi baixado na última vez** que o script rodou e o site foi publicado. Cada número traz a sua data, então nunca fica um número velho sem data. Mas, para ficar sempre atualizado, o ideal é rodar isto automaticamente todo dia (próxima etapa).

## Cuidados
- A série da Selic no Banco Central traz dias **futuros** (a meta vale até a próxima reunião). O script ignora as datas depois de hoje.
- O Banco Central só devolve até 20 valores por pedido; para a Selic, o script pede por intervalo de datas (os últimos dois anos e meio).

## Se der erro
- "respondeu com erro": o site do Banco Central pode estar fora do ar. Tente mais tarde.
- "veio com poucos valores": a série mudou de número ou foi encerrada. Peça ajuda ao Claude.
