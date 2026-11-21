# Script: mapa dos estados

## O que faz
Baixa do IBGE o contorno dos 27 estados do Brasil e o nome, a sigla e a região de cada um.
Depois transforma esse contorno em um desenho que o site consegue mostrar.

## De onde vêm os dados
- Contornos: API de Malhas do IBGE — https://servicodados.ibge.gov.br/api/docs/malhas?versao=3
- Nomes, siglas e regiões: API de Localidades do IBGE — https://servicodados.ibge.gov.br/api/docs/localidades

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/mapa-estados/baixar.mjs
```

Deve aparecer: `Pronto: 27 estados salvos em dados/geo/brasil-estados.json`

## O que ele cria
`dados/geo/brasil-estados.json` — não edite esse arquivo à mão; rode o script de novo.

## Quando rodar de novo
Raramente. Só se o IBGE mudar as fronteiras ou se quisermos um mapa com mais detalhe.

## Se der erro
- "O IBGE respondeu com erro": o site do IBGE pode estar fora do ar. Tente mais tarde.
- "Esperava 27 estados": o IBGE mudou algo no formato. Peça ajuda ao Claude.
