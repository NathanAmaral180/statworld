# Script: PIB dos estados

## O que faz
Baixa do IBGE os números da economia de cada estado e prepara as medidas do mapa:

| Medida no site | De onde vem |
|---|---|
| **Peso no PIB** | Participação de cada estado no PIB do Brasil, publicada pelo IBGE (Tabela 2). |
| **PIB por pessoa** | **Cálculo nosso**: PIB do estado (Tabela 1) dividido pela população estimada pelo IBGE no mesmo ano. |
| **Crescimento** | Quanto a economia do estado cresceu de um ano para o outro, já descontada a inflação (Tabela 3, "série encadeada do volume"). |
| **Impostos sobre produtos (% do PIB)** | **Cálculo nosso**: (PIB − valor adicionado) ÷ PIB (Tabelas 1 e 4). Pela definição do IBGE, PIB = valor adicionado + impostos (menos subsídios) sobre produtos. Guarda também o valor do Brasil, para comparar. **Não é arrecadação.** Conferido: em 2021 o cálculo dá exatamente o número publicado pelo IBGE na tabela 5938 do Sidra, nos 27 estados. |

## Todos os anos (2002 até o mais recente)
O script também gera `dados/economia/brasil-estados-anos.json`, com as mesmas quatro medidas **ano a ano**, para o seletor de ano e o botão "ver a evolução" do site (Visão geral e Impostos).
- Vem do arquivo do IBGE com a série inteira ("Especiais_2002_AAAA_xls.zip"), na mesma metodologia do ano mais recente. O ano mais recente é idêntico ao de `brasil-estados.json`.
- **Crescimento** começa em 2003 (precisa do ano anterior).
- **PIB por pessoa** usa a população do IBGE de cada ano: estimativa anual (tabela 6579); em 2007 a Contagem da População (tabela 793); em 2010 o Censo (tabela 202); em 2022 o Censo (tabela 4709). **2023 fica "sem dado"**: o IBGE não publicou estimativa de população para esse ano.
- **PIB por pessoa dos anos antigos é corrigido pela inflação** (IPCA, tabela 1737 do Sidra): média do índice do ano mais recente ÷ média do índice do ano. Assim o mapa compara anos de verdade. O valor da época, sem correção, fica guardado em `valoresDaEpoca` e aparece na ficha.

## De onde vêm os dados
- **Contas Regionais do Brasil**, do IBGE. Planilhas em https://ftp.ibge.gov.br/Contas_Regionais/
  (arquivo "Especiais_2010_AAAA_xls.zip").
- **Estimativas da População**, do IBGE: https://sidra.ibge.gov.br/tabela/6579 (e Censos 2010 e 2022, Contagem 2007).
- **IPCA**, do IBGE: https://sidra.ibge.gov.br/tabela/1737

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/pib-estados/baixar.mjs
```

Deve aparecer: `Pronto: dados de 27 estados (AAAA) salvos em dados/economia/brasil-estados.json` e a linha da série de anos.

## O que ele cria
`dados/economia/brasil-estados.json` (ano mais recente) e `dados/economia/brasil-estados-anos.json` (todos os anos), com valor, fonte, data e explicação do cálculo de cada medida.
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
