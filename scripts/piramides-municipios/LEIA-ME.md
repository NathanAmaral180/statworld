# Script: pirâmide etária de cada município

## O que faz
Busca no IBGE a população de cada município de um estado por **sexo** e **faixa de idade de 5 anos**, no Censo 2022. O padrão é São Paulo. A última faixa junta todas as pessoas de 80 anos ou mais.

O site usa essa pirâmide na **ficha do município** da Demografia (`/sp/demografia/municipio?m=<código>`). Com ela, a ficha também calcula a idade mediana e o índice de envelhecimento da cidade.

## De onde vem
IBGE, Censo Demográfico 2022, tabela 9514 do Sidra: https://sidra.ibge.gov.br/tabela/9514

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/piramides-municipios/baixar.mjs
```

Para outro estado:

```
$env:UF="MG"; node scripts/piramides-municipios/baixar.mjs
```

## O que ele cria
`dados/demografia/brasil-<uf>-piramides.json`. Para cada município vem `[homens[17], mulheres[17]]`.

## Conferido (27 nov 2026)
A soma da pirâmide de Adamantina dá 34.687 pessoas, igual à população do Censo.

## Quando rodar de novo
Só no próximo Censo.
