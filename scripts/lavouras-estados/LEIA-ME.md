# Script: lavouras por estado (Agro)

## O que faz
Baixa do IBGE, para cada estado e cada produto das lavouras (soja, milho, café, cana etc.):
- o **valor da produção** (em reais);
- a **quantidade produzida** (em toneladas).

Também baixa o valor total das lavouras de cada estado.

## De onde vêm os dados
**Produção Agrícola Municipal (PAM)**, do IBGE, tabela 5457 do Sidra: https://sidra.ibge.gov.br/tabela/5457

**Importante:** a PAM cobre só **lavouras**. Ela não inclui gado, frango, leite, madeira plantada nem extrativismo. Por isso o site diz "lavouras", e não "agro" inteiro.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/lavouras-estados/baixar.mjs
```

Deve aparecer: `Pronto: NN produtos em 27 estados (AAAA) salvos em dados/agro/brasil-estados-lavouras.json`

## O que ele cria
`dados/agro/brasil-estados-lavouras.json`. Não edite à mão; rode o script de novo.

## Regras que o script segue
- Quando o IBGE escreve "-", o estado **não produz** aquele produto. O script guarda 0 e o site mostra "não produz".
- Quando o IBGE escreve "..." ou "X", **não há dado**. O script guarda `null` e o site mostra "sem dado", nunca zero.
- O café aparece uma vez só (o total). As divisões arábica e canéfora são ignoradas para não contar o café duas vezes.
- A data de atualização vem do próprio IBGE.

## Quando rodar de novo (uma vez por ano)
O IBGE divulga um ano novo da PAM entre setembro e outubro.
1. No topo do arquivo `baixar.mjs`, troque `ANO` pelo ano novo.
2. Rode o comando acima.

## Se der erro
- "ainda não publicou o ano": volte o `ANO` para o anterior.
- "unidade inesperada" ou "mesmo identificador": o IBGE mudou algo na tabela. Peça ajuda ao Claude.
- "O IBGE respondeu com erro": tente mais tarde.
