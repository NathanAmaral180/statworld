# Script: planos de saúde (tema Saúde)

## O que faz
Busca na **ANS** (ANS TabNet), no mês mais recente, quantas pessoas têm plano de **assistência médica** (os planos só odontológicos ficam de fora). Faz isso para o Brasil, os estados e os municípios de um estado (padrão SP), e divide pela população estimada pelo IBGE.

Conta pelo município de residência informado no contrato. Uma pessoa com dois planos conta duas vezes.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/saude-planos/baixar.mjs
```

## O que ele cria
`dados/saude/brasil-planos.json` e `dados/saude/brasil-<uf>-planos.json`.

## Conferido (27 nov 2026, setembro de 2026)
Brasil: 53.108.097 beneficiários, 24,8% da população. São Paulo: 40,5%.

## Quando roda
A ANS publica a cada 3 meses, e o script pega sozinho o mês mais recente.
