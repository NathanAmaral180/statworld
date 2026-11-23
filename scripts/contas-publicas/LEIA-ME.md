# Script: Contas públicas

## O que faz
Prepara as três vistas da aba **Contas públicas**:

| Vista | Fonte | Período |
|---|---|---|
| **De onde vem e para onde vai cada R$ 100** do governo federal | Tesouro Nacional, [Resultado do Tesouro Nacional](https://www.tesourotransparente.gov.br/ckan/dataset/resultado-do-tesouro-nacional) (planilha "Série Histórica - Mensal", tabela 1.1) | último ano completo |
| **Dívida bruta do governo geral** (% do PIB), mês a mês desde 2008 | Banco Central, [série 13762 do SGS](https://dadosabertos.bcb.gov.br/dataset/13762) | mensal |
| **Gasto por função** (classificação internacional COFOG) | Tesouro Nacional, [Despesas por Função do Governo Central – COFOG](https://www.tesourotransparente.gov.br/ckan/dataset/despesas-por-funcao-do-governo-central-classificacao-cofog) | último ano publicado (hoje, 2024) |

"Governo federal" aqui é o **governo central**: União, INSS e Banco Central.

## Como é montado o "Cada R$ 100" (cálculo do StatWorld)
Com as linhas oficiais da tabela 1.1 do RTN, somando os 12 meses do ano:

- **De onde vem:**
  - **Impostos sobre consumo e operações:** Cofins, PIS/Pasep, IPI, IOF, Imposto de Importação e Cide.
  - **Impostos sobre renda e lucro:** Imposto de Renda e CSLL.
  - **Contribuições à Previdência (INSS):** arrecadação líquida para o RGPS.
  - **Outras receitas:** outras receitas da Receita Federal, incentivos fiscais e receitas não administradas pela Receita (royalties, dividendos, concessões…).
  - **Nova dívida:** gastos totais menos receitas, isto é, o que faltou e foi pago com empréstimo.
- **Para onde vai:**
  - **Aposentadorias e pensões do INSS:** benefícios previdenciários.
  - **Juros da dívida:** juros nominais do governo central (linha 9 da tabela).
  - **Repasses a estados e municípios:** transferências por repartição de receita.
  - **Servidores:** pessoal e encargos sociais.
  - **BPC, abono e seguro-desemprego.**
  - **Ministérios:** despesas do Poder Executivo sujeitas à programação financeira.
  - **Outras despesas obrigatórias:** o resto das obrigatórias.

Cada lado é dividido pelo total de gastos e arredondado para somar exatamente 100 quadradinhos.

**Conferência (2025):** o resultado primário (−R$ 61,7 bi), a despesa total (R$ 2,394 tri) e a receita líquida (R$ 2,333 tri) batem com a [notícia oficial do Tesouro](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/janeiro/governo-central-cumpre-com-folga-a-meta-fiscal-estabelecida-para-2025-aponta-relatorio-do-tesouro).

## Gasto por função (COFOG)
- A base do Tesouro vem em **R$ milhões**, embora o cabeçalho diga "R$". Conferido: proteção social em 2024 dá R$ 1.518,5 bi, como no boletim COFOG do Tesouro.
- Duas partes de "serviços públicos gerais" aparecem separadas, por serem grandes: **juros e encargos da dívida** (COFOG 701.7) e **transferências a estados e municípios** (701.8). As duas são subdivisões da própria COFOG.

## Como rodar
Na pasta `statworld`:

```
node scripts/contas-publicas/baixar.mjs
```

O script mostra, no fim, os números de conferência (resultado primário, despesa total, receita líquida). Compare com a notícia do Tesouro.

## O que ele cria
- `dados/contas-publicas/brasil-r100.json`
- `dados/contas-publicas/brasil-divida.json`
- `dados/contas-publicas/brasil-cofog.json`

Não edite esses arquivos à mão; rode o script de novo.

## Quando rodar de novo
- **Dívida:** todo mês. O Banco Central divulga as estatísticas fiscais no fim do mês seguinte.
- **Cada R$ 100:** uma vez por ano, quando o Tesouro publica dezembro (fim de janeiro). O script passa sozinho para o ano novo.
- **COFOG:** uma vez por ano, quando o Tesouro publica a base nova (por volta de dezembro).

## Se der erro
- "Não achei a linha…" ou "mudou de formato": o Tesouro mudou a planilha ou a base. Peça ajuda ao Claude.
- "O RTN não tem os 12 meses": o ano ainda não fechou na planilha. Espere a publicação de dezembro.
