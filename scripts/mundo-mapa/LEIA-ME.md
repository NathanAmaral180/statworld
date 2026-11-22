# Script: mapa-múndi (página inicial)

## O que faz
Baixa as fronteiras dos países e desenha o mapa-múndi da página inicial, na projeção "Equal Earth" (que mantém o tamanho real das áreas: a Groenlândia não fica gigante).
A Antártida fica de fora. Países que cruzam a linha de 180° (como Fiji e Rússia) são ajustados para não aparecer uma linha atravessando o mapa.

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
