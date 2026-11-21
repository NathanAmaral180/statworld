# Script: mapa dos estados dos EUA

## O que faz
Baixa o contorno dos 50 estados americanos e do Distrito de Colúmbia e transforma no mesmo tipo de desenho usado no mapa do Brasil.
O Alasca e o Havaí aparecem em quadros no canto de baixo, como é costume nos mapas dos EUA.
O script também guarda o nome de cada estado em português (ex.: Nova York, Havaí) e a região do Census Bureau (Nordeste, Meio-Oeste, Sul, Oeste).

## De onde vêm os dados
- Contornos: U.S. Census Bureau (Cartographic Boundary Files, domínio público), no pacote "us-atlas", que já traz o mapa com o Alasca e o Havaí reposicionados: https://github.com/topojson/us-atlas
- Regiões: Census Bureau — https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/eua-mapa-estados/baixar.mjs
```

Deve aparecer: `Pronto: 51 estados salvos em dados/geo/eua-estados.json`

## O que ele cria
`dados/geo/eua-estados.json`. Não edite à mão.

## Quando rodar de novo
Raramente: só se as fronteiras mudarem ou se quisermos um mapa com mais detalhe.

## Se der erro
- "Não consegui baixar o mapa": o site do pacote pode estar fora do ar. Tente mais tarde.
- "Esperava 51": o pacote mudou. Peça ajuda ao Claude.
