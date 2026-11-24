# Script: Comércio exterior dos EUA

## O que faz
Baixa da **API do Census** (US Census Bureau, International Trade):
- **exportações de cada estado** no último ano completo (mapa, ranking e ficha com a parte do país);
- os **10 principais produtos** exportados, pela classificação internacional HS (Sistema Harmonizado), 4 dígitos;
- os **10 principais países compradores**;
- a **balança comercial do ano em curso** (janeiro até o último mês publicado) e o mesmo período do ano anterior.

Os nomes em português de produtos e países vêm do **Comex Stat** (Brasil), que usa a mesma classificação de produtos. Dois códigos existem só nos EUA e foram traduzidos da descrição oficial do Census: 8800 ("Aeronaves civis, motores e partes") e 9880 ("Remessas de baixo valor").

## Chave (obrigatória)
A API do Census exige uma **chave gratuita**, pedida em https://api.census.gov/data/key_signup.html.
- **No computador:** fica no arquivo `.env` da pasta `statworld` (linha `CENSUS_API_KEY=...`). Esse arquivo **não vai para o GitHub**.
- **Na rotina automática:** fica no GitHub, em Settings → Secrets and variables → Actions, com o nome `CENSUS_API_KEY`.
- **Nunca** escreva a chave dentro de um script ou de uma página.

## Como rodar
Na pasta `statworld`:

```
node scripts/eua-comercio/baixar.mjs
```

## O que ele cria
`dados/comercio/eua-estados.json`, `eua-listas.json`, `eua-balanca.json`. Não edite à mão.

## Conferência (24 nov 2026)
O total exportado em 2025 pela API é US$ 2.179,9 bi. Na divulgação preliminar do Census, em fevereiro de 2026, foi US$ 2.185,2 bi. A diferença (0,2%) é a revisão anual de junho de 2026. A API sempre traz o número mais revisado.

## Se der erro
- **"O Census recusou a chave":** a chave está errada, não foi ativada (há um link no e-mail do Census) ou não está no `.env` ou no segredo do GitHub.
- **"Falta a chave":** crie o `.env` ou o segredo, como explicado acima.
- **"sem nome em português":** algum produto ou país novo não está no Comex Stat. O site mostra o nome em inglês até alguém acrescentar a tradução no script.
