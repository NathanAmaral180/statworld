# Script: Preços e poder de compra

## O que faz
Prepara os números da aba **Preços e poder de compra**:

| No site | De onde vem | Frequência |
|---|---|---|
| **Inflação em 12 meses**, mês a mês desde 2019 (gráfico) | IBGE, IPCA, [tabela 1737 do Sidra](https://sidra.ibge.gov.br/tabela/1737), variável "acumulada em 12 meses" | mensal |
| **Meta e intervalo de tolerância** (faixa cinza do gráfico) | Banco Central / Conselho Monetário Nacional, [histórico das metas](https://www.bcb.gov.br/controleinflacao/historicometas). **Digitado no script** (lista `METAS`), porque o Banco Central não publica em formato de dados | anual (desde 2025, "meta contínua") |
| **Cesta básica na capital de cada estado** (mapa e ranking) | DIEESE, Pesquisa Nacional da Cesta Básica de Alimentos, pela série [CESBTOTAL do Ipeadata](http://www.ipeadata.gov.br/ExibeSerie.aspx?serid=CESBTOTAL) | mensal |
| **Parte do salário mínimo** e **cestas que o salário compra** (ficha) | Cálculo do StatWorld: cesta ÷ salário mínimo bruto do mês | mensal |
| **Salário mínimo em cestas, média de cada ano** desde 2000 (colunas) | Cálculo do StatWorld com a cesta (acima) e o [salário mínimo vigente](http://www.ipeadata.gov.br/ExibeSerie.aspx?serid=MTE12_SALMIN12) (Ipeadata) | mensal |

**Datas:**
- IPCA: data de divulgação do próprio IBGE.
- Cesta básica: o DIEESE não informa a data em formato de dados. Por isso o site mostra "**atualizada em**" a data em que o Ipeadata atualizou a série, e não "divulgada em".

**Conferência (outubro de 2026):**
- **Cesta básica:** os valores batem com o relatório do DIEESE (São Paulo R$ 951,37; Rio de Janeiro R$ 939,39; Fortaleza R$ 822,70; Recife R$ 705,98).
- **Inflação:** o IPCA em 12 meses (4,63%) é o mesmo da tabela do Banco Central.
- **Metas:** conferidas na página do Banco Central em 22 nov 2026. De 2019 a 2024 foram 4,25 / 4,00 / 3,75 / 3,50 / 3,25 / 3,00%, sempre com ±1,5 ponto. A partir de 2025 a meta é 3,00% ±1,5 ponto, verificada todo mês.

**Cuidados:**
- **Salário mínimo usado:** é o **bruto**. O DIEESE calcula "% do salário mínimo **líquido**" (descontada a Previdência), que dá um número um pouco maior; o site diz qual conta fez.
- **Capitais pesquisadas:** o número mudou ao longo do tempo (16 em 2000, 27 hoje), então a comparação entre anos distantes é aproximada. Em 2015–2018 a série traz uma cidade de Roraima que não é a capital; o script a deixa de fora.

## Como rodar
Na pasta `statworld`:

```
node scripts/precos/baixar.mjs
```

## O que ele cria
- `dados/precos/brasil-ipca.json`: inflação em 12 meses com a meta de cada mês.
- `dados/precos/brasil-estados.json`: cesta básica por capital e o peso dela no salário mínimo.
- `dados/precos/brasil-sm-cestas.json`: salário mínimo em cestas, média de cada ano.

Não edite esses arquivos à mão; rode o script de novo.

## Quando rodar de novo
- **Todo mês.** O IBGE divulga o IPCA por volta do dia 10, e a cesta básica sai no começo do mês seguinte.
- **Quando o Conselho Monetário Nacional mudar a meta** (costuma decidir em junho): acrescente a nova meta na lista `METAS` no começo do `baixar.mjs`, conferindo no site do Banco Central.

## Se der erro
- "Erro 500" ou demora no Ipeadata: o serviço do Ipea às vezes fica lento ou cai. Tente mais tarde.
- "Sem salário mínimo para…": a série do salário mínimo ainda não chegou ao mês da cesta. Espere a atualização do Ipeadata.
