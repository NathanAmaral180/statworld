# Script: agro dos EUA por estado e produto

## O que faz
Baixa do USDA (Departamento de Agricultura dos EUA, serviço ERS) quanto os produtores de cada estado receberam pela venda de cada produto agropecuário. Em inglês, isso se chama "cash receipts".
É o número dos EUA mais parecido com o "valor da produção" que usamos no Brasil.

## De onde vêm os dados
Página do USDA: https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/data-files-us-and-state-level-farm-income-and-wealth-statistics
Arquivo: "Download All Data in CSV File Format (ZIP)", da publicação mais recente. Não precisa de cadastro.

## Regras que o script segue
- Ele pega **só produtos**, e não as somas de grupos (como "todas as lavouras" ou "carnes"), para não contar nada duas vezes. O algodão entra uma vez só (pluma + caroço já somados).
- Os **totais** de cada estado (tudo, lavouras, pecuária) são os publicados pelo próprio USDA. Eles incluem itens que o USDA chama de "outros" e não detalha. Por isso, a soma dos produtos é um pouco menor que o total.
- Quando um estado **não aparece** para um produto, o site mostra **"sem dado"**. O USDA não diz se o estado não vendeu nada ou se o número é sigiloso, então nunca pomos zero.
- O Distrito de Colúmbia não aparece no USDA e fica "sem dado".
- Os nomes são traduzidos para o português por uma lista dentro do script. Produtos com o mesmo identificador do Brasil (soja, milho, frango…) usam o mesmo ícone e a mesma cor.
- Não há quantidade (toneladas), só valor. Por isso, as páginas de produto dos EUA mostram só o valor.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/eua-agro-estados/baixar.mjs
```

## O que ele cria
`dados/agro/eua-estados.json`. Não edite à mão.

## Quando rodar de novo
O USDA atualiza os dados em fevereiro, setembro e dezembro. Para atualizar:
1. Na página do USDA, copie o link de "Download All Data in CSV File Format (ZIP)" da publicação mais nova.
2. No topo de `baixar.mjs`, troque `URL_ZIP` por esse link e, se for o caso, `ANO`.
3. Rode o comando acima.

## Se der erro
- "Produtos novos no USDA, sem nome em português": o USDA incluiu um produto. Peça ao Claude para acrescentar a tradução.
- "Coluna sumiu" ou "Unidade inesperada": o USDA mudou o formato. Peça ajuda ao Claude.
- "respondeu com erro 404": o link do arquivo mudou. Pegue o novo na página do USDA.
