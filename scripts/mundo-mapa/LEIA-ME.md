# Script: mapa-múndi (página inicial)

## O que faz
Baixa as fronteiras dos países e desenha o mapa-múndi da página inicial **do mesmo jeito que o design** (rodada 3): projeção Natural Earth girada 10°, contorno arredondado do globo e grade de linhas a cada 10°.
A Antártida fica de fora. Os países que cruzam a linha de 180° (como Fiji e Rússia) são cortados corretamente pela biblioteca de mapas (d3-geo), a mesma que o design usa.

## De onde vêm os dados
Natural Earth (domínio público), escala 1:110 milhões, pelo pacote "world-atlas": https://www.naturalearthdata.com/

## Como rodar
```
node scripts/mundo-mapa/baixar.mjs
```

## O que ele cria
`dados/geo/mundo-paises.json`, com um desenho por país e o código numérico ISO do país (o Brasil é `076`).
Quais países aparecem como "disponível" é definido em `src/config/site.json`, no campo `paises`.

## Quando rodar de novo
Raramente: só se as fronteiras mudarem.
