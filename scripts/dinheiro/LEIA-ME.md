# Script: Dinheiro e juros

## O que faz
Baixa do **Banco Central do Brasil** (sistema SGS, [dados abertos](https://dadosabertos.bcb.gov.br)) as séries do painel da aba **Dinheiro e juros**:

| No site | Série do SGS | Frequência | Período baixado |
|---|---|---|---|
| Dólar comercial (R$ por US$, venda, PTAX) | 1 | diário (dias úteis) | 5 anos |
| Selic, meta (% ao ano) | 432 | muda nas reuniões do Copom | 5 anos |
| Juros médios do crédito (% ao ano, todas as operações) | 20714 | mensal | 10 anos |
| Juros do crédito pessoal não consignado (% ao ano) | 20742 | mensal | 10 anos |
| Inadimplência (% da carteira com atraso acima de 90 dias) | 21082 | mensal | 10 anos |
| Saldo do crédito (R$, total emprestado no país) | 20539 (em R$ milhões; o script converte para R$) | mensal | 10 anos |

Os nomes oficiais de cada série estão no começo do `baixar.mjs` e aparecem na fonte de cada gráfico.

**Datas:** cada valor mostra a data a que se refere (o dia, para dólar e Selic; o mês, para as mensais). O Banco Central não informa a data de publicação de cada valor, então o site mostra também "consultado em" (o dia em que o script baixou os dados).

**O que não está (e por quê):**
- **"Ao vivo":** o site é atualizado quando o script roda e o site é publicado de novo. Não mostra cotação durante o pregão.
- **Bolsa (Ibovespa):** a série do índice no SGS (série 7) parou em 2019, e as cotações da B3 exigem licença de uso. Só entra com uma fonte oficial e liberada.

## Como rodar
Na pasta `statworld`:

```
node scripts/dinheiro/baixar.mjs
```

## O que ele cria
`dados/dinheiro/brasil-series.json`. Não edite à mão; rode o script de novo.

## Quando rodar de novo
- **Dólar e Selic:** quanto mais vezes, mais atual (o ideal seria todo dia útil; ver a automação pendente da faixa "Agora").
- **Séries mensais:** o Banco Central divulga as estatísticas de crédito no fim do mês seguinte.

## Se der erro
- "O Banco Central não entregou a série…": às vezes a API responde vazio. O script já tenta 4 vezes; rode de novo mais tarde.
