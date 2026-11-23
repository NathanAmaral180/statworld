# Script: Comércio exterior

## O que faz
Prepara os números da aba **Comércio exterior**, com a **API oficial do Comex Stat** (Secex, Ministério do Desenvolvimento, Indústria, Comércio e Serviços): https://api-comexstat.mdic.gov.br

| No site | O que é | Período |
|---|---|---|
| **Exportações por estado** (mapa, ranking, ficha) | Quanto empresas de cada estado venderam ao exterior, em dólares (FOB) | último ano completo |
| **Parte das exportações do país** (ficha) | Cálculo do StatWorld: exportações do estado ÷ total do país | último ano completo |
| **Principais produtos** (lista) | Os 10 maiores, agrupados pela classificação internacional **CUCI/SITC** (nível "posição"), a mesma dos destaques do MDIC | último ano completo |
| **Principais parceiros** (lista) | Os 10 países que mais compraram | último ano completo |
| **Balança comercial** (cartão ao lado) | Exportações, importações e saldo de janeiro até o último mês com dado, e o saldo do mesmo período do ano anterior | ano em curso |

- O **total do país** inclui uma parte sem estado declarado ("Não declarada"); essa parte não aparece em nenhum estado.
- A **data** mostrada é a de atualização do Comex Stat (a API informa sozinha). O site escreve "atualizada em".

**Conferência (22 nov 2026):** de janeiro a outubro de 2026, a API deu exportações de US$ 321,88 bi, importações de US$ 250,84 bi e saldo de US$ 71,04 bi. São os mesmos números da [notícia oficial do MDIC](https://www.gov.br/mdic/pt-br/assuntos/noticias/2026/novembro/corrente-de-comercio-brasileira-chega-a-us-66-3-bi-um-recorde-para-o-mes-de-outubro-na-serie-historica).

## Como rodar
Na pasta `statworld`:

```
node scripts/comercio/baixar.mjs
```

A API limita pedidos seguidos. Se ela demorar, o script espera e tenta de novo sozinho, então a execução pode levar 1 ou 2 minutos.

## O que ele cria
- `dados/comercio/brasil-estados.json`: exportações e parte de cada estado.
- `dados/comercio/brasil-listas.json`: os 10 produtos e os 10 países.
- `dados/comercio/brasil-balanca.json`: a balança do ano em curso.

Não edite esses arquivos à mão; rode o script de novo.

## Quando rodar de novo
**Todo mês**, depois que o MDIC divulga a balança do mês (primeiros dias do mês seguinte). Em janeiro, quando sai o ano anterior completo, o mapa e as listas passam sozinhos para o ano novo.

## Se der erro
- "O Comex Stat não respondeu": a API pode estar fora do ar ou limitando pedidos. Tente de novo mais tarde.
- "estados sem valor de exportação": algum estado veio sem dado; o site mostra com hachura. Vale conferir no comexstat.mdic.gov.br.
