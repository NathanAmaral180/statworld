# Script: indústria por estado e setor

## O que faz
Baixa do IBGE, para cada estado e cada um dos **29 setores da indústria** (divisões da CNAE):
- o **valor da transformação industrial** (VTI): o valor que a indústria produz menos o custo das operações industriais. É a medida de "quanto a indústria acrescenta";
- as **pessoas ocupadas** em cada setor.

Também traz os totais do estado: toda a indústria, só a extrativa e só a de transformação.

## De onde vêm os dados
**IBGE, Pesquisa Industrial Anual – Empresa**, tabela 10457 do Sidra: https://sidra.ibge.gov.br/tabela/10457
Cobre empresas industriais com 5 ou mais pessoas ocupadas. Não inclui construção nem energia.

## Cuidado importante: sigilo
Quando um setor tem poucas empresas num estado, o IBGE **esconde** o número (aparece "X"), para não revelar dados de uma empresa.
- No site, esses casos aparecem como **"sem dado"**, nunca como zero.
- O script calcula **quanto do valor de cada estado ficou escondido** (`escondidoPorSigilo`). A ficha do estado mostra essa porcentagem.
- Por isso, o "setor líder" é o maior **entre os setores publicados**. Em estados com muito sigilo (em 2024: AP 52%, ES 36%, SE 31%, PI 30%), o líder verdadeiro pode ser um setor escondido.
- Quando o IBGE escreve "-", o estado **não tem** o setor (zero).

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/industria-estados/baixar.mjs
```

## O que ele cria
`dados/industria/brasil-estados.json`. Não edite à mão.

## Quando rodar de novo
Uma vez por ano. O IBGE publica um ano novo da pesquisa por volta de junho. No topo de `baixar.mjs`, troque `ANO`.

## Se der erro
- "ainda não publicou": volte o `ANO` para o anterior.
- "Setor novo na tabela" ou "Esperava 29 setores": o IBGE mudou a classificação. Peça ajuda ao Claude.
