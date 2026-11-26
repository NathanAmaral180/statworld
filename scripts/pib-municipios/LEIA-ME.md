# Script: PIB dos municípios de um estado

## O que faz
Baixa do IBGE a planilha completa do **PIB dos Municípios** e separa os municípios de um estado (o padrão é São Paulo).

| Medida | De onde vem | Ano |
|---|---|---|
| **PIB** | Valor publicado pelo IBGE. A planilha vem em R$ mil; o arquivo guarda em R$. | 2023 |
| **Peso no PIB do estado** | **Cálculo nosso**: PIB do município ÷ soma dos municípios do estado. O IBGE publica o mesmo número na tabela 5938 do Sidra, com 2 casas. | 2023 |
| **PIB por pessoa** | Valor publicado pelo IBGE. Para 2022 e 2023, o IBGE usou a população do Censo 2022. | 2023 |
| **Posição no Brasil** | **Cálculo nosso**: ordem entre os 5.570 municípios do país, do PIB e do PIB por pessoa. | 2023 |
| **Setores** (agropecuária, indústria, serviços, administração pública, impostos) e as **3 atividades que mais pesam** | Valores publicados pelo IBGE. | **2021** |

### Por que os setores são de 2021
Na edição 2022–2023, o IBGE divulgou só o PIB e o PIB por pessoa dos municípios, sem a divisão por setor. Isso está explicado na nota técnica 02/2024 do Sistema de Contas Nacionais. O script pega sozinho o último ano que tem os setores e escreve esse aviso no arquivo (`setores.observacao`), para o site mostrar.

### Série de anos
O script também guarda o PIB e o PIB por pessoa de **2010 a 2023**, para um futuro "ver a evolução". Os valores estão em reais de cada ano, **sem correção pela inflação**.

## De onde vêm os dados
- Planilha: https://ftp.ibge.gov.br/Pib_Municipios/2022_2023/base/base_de_dados_2010_2023_xlsx.zip (cerca de 20 MB)
- Notícia da divulgação (19 dez 2025): https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/45548-municipios-dependentes-da-industria-extrativa-freiam-desconcentracao-economica-em-2023

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/pib-municipios/baixar.mjs
```

Deve aparecer: `Pronto: 645 municípios de São Paulo (2023; setores de 2021) ...`

Para outro estado:

```
$env:UF="MG"; node scripts/pib-municipios/baixar.mjs
```

## O que ele cria
- `dados/economia/brasil-<uf>-municipios.json`: ano mais recente, posição no Brasil e setores.
- `dados/economia/brasil-<uf>-municipios-anos.json`: a série de anos.

A chave de cada valor é o código do município no IBGE (7 dígitos). Não edite esses arquivos à mão; rode o script de novo.

## Conferido (26 nov 2026)
- O PIB e o peso no PIB do estado batem com a tabela 5938 do Sidra nos 645 municípios de SP. A diferença máxima é de arredondamento: R$ 0,5 mil no PIB e 0,005 ponto no peso.
- O maior e o menor PIB por pessoa do Brasil em 2023 batem com a notícia do IBGE: Saquarema (RJ), R$ 722,4 mil, e Manari (PE), R$ 7.201,70.

## Quando rodar de novo (uma vez por ano)
O IBGE divulga o PIB dos Municípios em dezembro. Quando sair uma edição nova:
1. Troque `pasta`, `arquivo`, `dataDivulgacao` e `noticia` em `EDICAO`, no começo do script.
2. Veja os nomes certos em https://ftp.ibge.gov.br/Pib_Municipios/

## Se der erro
- "O arquivo do IBGE não foi baixado": o endereço mudou ou o FTP do IBGE está fora do ar. Confira em https://ftp.ibge.gov.br/Pib_Municipios/.
- "Coluna não encontrada": o IBGE mudou o título de uma coluna da planilha. Peça ajuda ao Claude.
- "Há município sem PIB": o total do estado ficaria errado, então o script para. Peça ajuda ao Claude.
