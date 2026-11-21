# Script: PIB dos estados

## O que faz
Baixa do IBGE os números da economia de cada estado e prepara as três medidas do mapa:

| Medida no site | De onde vem |
|---|---|
| **Peso no PIB** | Participação de cada estado no PIB do Brasil, publicada pelo IBGE (Tabela 2). |
| **PIB por pessoa** | **Cálculo nosso**: PIB do estado (Tabela 1) dividido pela população estimada pelo IBGE no mesmo ano. |
| **Crescimento** | Quanto a economia do estado cresceu de um ano para o outro, já descontada a inflação (Tabela 3, "série encadeada do volume"). |

## De onde vêm os dados
- **Contas Regionais do Brasil**, do IBGE. Planilhas em https://ftp.ibge.gov.br/Contas_Regionais/
  (arquivo "Especiais_2010_AAAA_xls.zip").
- **Estimativas da População**, do IBGE: https://sidra.ibge.gov.br/tabela/6579

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/pib-estados/baixar.mjs
```

Deve aparecer: `Pronto: dados de 27 estados (AAAA) salvos em dados/economia/brasil-estados.json`

## O que ele cria
`dados/economia/brasil-estados.json`, com valor, fonte, data e explicação do cálculo de cada medida.
Não edite esse arquivo à mão; rode o script de novo.

## Quando rodar de novo (uma vez por ano)
O IBGE divulga um ano novo das Contas Regionais todo mês de novembro.
1. Abra o arquivo `baixar.mjs` e troque, no topo, as três linhas marcadas:
   `ANO`, `DATA_DIVULGACAO` e `URL_NOTICIA` (link da notícia do IBGE sobre a divulgação).
2. Rode o comando acima.
3. Confira no site se os números batem com a notícia do IBGE.

## Se der erro
- "O IBGE respondeu com erro": o site do IBGE pode estar fora do ar. Tente mais tarde.
- "não tem o ano": o IBGE ainda não publicou esse ano. Volte o `ANO` para o anterior.
- "esperava 27 estados": o IBGE mudou o formato da planilha. Peça ajuda ao Claude.
- Se aparecer "valores ficaram como sem dado", o site vai mostrar esses estados hachurados. Isso não é erro, mas vale conferir no IBGE.
