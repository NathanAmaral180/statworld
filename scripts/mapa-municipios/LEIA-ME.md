# Script: mapa dos municípios de um estado

## O que faz
Baixa do IBGE o contorno de todos os municípios de um estado (o padrão é São Paulo) e transforma esse contorno em um desenho que o site consegue mostrar.
Guarda também, para cada município:
- a **região geográfica intermediária**, que o IBGE criou em 2017 (SP tem 11, como "Campinas" e "Ribeirão Preto");
- a **região imediata**, que é menor (ex.: "Adamantina - Lucélia").

Baixa ainda o contorno de cada região intermediária, para o mapa desenhar uma linha mais forte entre as regiões.

## De onde vêm os dados
- Contornos: API de Malhas do IBGE — https://servicodados.ibge.gov.br/api/docs/malhas?versao=3
- Nomes e regiões: API de Localidades do IBGE — https://servicodados.ibge.gov.br/api/docs/localidades

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/mapa-municipios/baixar.mjs
```

Deve aparecer: `Pronto: 645 municípios e 11 regiões de São Paulo salvos em dados/geo/brasil-sp-municipios.json`

Para outro estado, troque a sigla:

```
$env:UF="MG"; node scripts/mapa-municipios/baixar.mjs
```

## O que ele cria
`dados/geo/brasil-<uf>-municipios.json` (ex.: `brasil-sp-municipios.json`). Não edite à mão; rode o script de novo.

Cada município entra com o código do IBGE (7 dígitos), que serve de identificador. É o mesmo código usado nos arquivos de dados.

## Quando rodar de novo
Raramente: só se o IBGE mudar limites de municípios ou se quisermos um mapa com mais detalhe. Para mais detalhe, troque `qualidade=minima` por `qualidade=intermediaria` no script (o arquivo fica maior).

## Se der erro
- "O IBGE respondeu com erro": o site do IBGE pode estar fora do ar. Tente mais tarde.
- "Esperava N municípios": o mapa e a lista de municípios do IBGE não bateram. Peça ajuda ao Claude.
- "Município sem área no desenho": um município ficou pequeno demais no desenho. Tente a qualidade intermediária.
