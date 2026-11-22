# Impostos hoje (faixa da aba Impostos)

**O que faz:** monta os 3 números do topo da aba Impostos e grava em `dados/impostos/brasil-hoje.json`.

| Número | De onde vem | Frequência |
|---|---|---|
| Impostos sobre produtos no PIB (Brasil) | IBGE, Contas Regionais — já calculado por `scripts/pib-estados/` | anual |
| Carga tributária bruta (tudo o que União, estados e municípios arrecadam, sobre o PIB) | Tesouro Nacional, [boletim de estimativa](https://www.tesourotransparente.gov.br/publicacoes/carga-tributaria-do-governo-geral/) | anual |
| Arrecadação federal do último mês | Receita Federal, [arquivo de dados abertos](https://www.gov.br/receitafederal/dados/arrecadacao-estado.csv) (soma de todos os tributos e estados) | mensal |

**Como rodar** (na pasta `statworld`, depois de `node scripts/pib-estados/baixar.mjs`):

```
node scripts/impostos-hoje/baixar.mjs
```

**O que atualizar à mão (no começo do `baixar.mjs`):**
- `CARGA`: o Tesouro publica a carga tributária 1 vez por ano (por volta de abril), num boletim (PDF), sem arquivo de dados. Quando sair o ano novo, troque ano, valor, data e link, conferindo na notícia oficial. O número de 2025 (32,40%) é **estimativa preliminar**; o número oficial definitivo é da Receita Federal.
- `ARRECADACAO_DIVULGADA`: o arquivo da Receita não diz quando cada mês foi divulgado. Quando o script avisar que chegou um mês novo, ponha o mês, a data e o link da notícia da Receita/Fazenda. Até lá, o site mostra o número sem a data de divulgação.

**Conferência feita (22 nov 2026):** a soma do arquivo para setembro de 2026 deu R$ 239,384 bilhões, igual à notícia oficial; setembro de 2025 deu R$ 216,727 bilhões, também igual.

**Se der erro:**
- "Rode antes scripts/pib-estados": rode o script do PIB primeiro.
- "mudou de formato": a Receita mudou as colunas do arquivo; abra o link e compare com o cabeçalho esperado (Ano; Mês; UF; tributos…).
- Erro 403/404: o endereço do arquivo mudou; procure "arrecadação por estado" em dados abertos da Receita Federal.
