# Script: exportações e importações por município

## O que faz
Busca no Comex Stat (Secex/MDIC) quanto cada município de um estado exportou e importou, em dólares. O padrão é São Paulo. São quatro medidas:
- **Exportações no ano**: de janeiro até o último mês com dado (hoje, janeiro a outubro de 2026);
- **Importações no ano**: o mesmo período;
- **Variação das exportações** sobre o mesmo período do ano anterior. É **cálculo nosso**. Fica "sem dado" quando o município não exportou nada no ano anterior, porque não dá para comparar com zero;
- **Exportações do último ano completo** (hoje, 2025).

## Atenção: o município é onde fica a empresa
No Comex Stat, o município é o **domicílio fiscal da empresa** que exportou, não necessariamente onde o produto foi feito. Exemplo: Santos aparece em 1º lugar porque muitas empresas exportadoras ficam lá.

Por isso a soma dos municípios **não bate** com o total do estado na aba Comércio exterior, que conta o estado de onde saiu o produto. Em 2025, a soma dos municípios de SP deu US$ 76,0 bi e o total do estado deu US$ 71,4 bi. O arquivo guarda esse aviso (`aviso`).

## Zero e "sem dado"
Quem não aparece no Comex Stat entra com **0**: não teve exportação registrada no período. Isso é diferente de `null` ("sem dado").

## De onde vêm os dados
API oficial do Comex Stat: https://api-comexstat.mdic.gov.br. Nomes dos municípios: API de Localidades do IBGE.

O Comex Stat usa códigos de município próprios, então o script junta as duas fontes pelo **nome**. Se algum nome não bater, ele avisa ("Atenção: ... nomes sem município do IBGE"). Aí basta acrescentar o par em `APELIDOS` no script. Exemplo: o Comex Stat ainda chama Embu das Artes de "Embu".

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/comercio-municipios/baixar.mjs
```

Para outro estado:

```
$env:UF="MG"; node scripts/comercio-municipios/baixar.mjs
```

## O que ele cria
`dados/comercio/brasil-<uf>-municipios.json` (ex.: `brasil-sp-municipios.json`). A chave de cada valor é o código do município no IBGE. Não edite à mão.

## Quando roda
Todo dia, na rotina automática. O Comex Stat atualiza os dados uma vez por mês, no começo do mês.

## Se der erro
- "Sem resposta de ...": o Comex Stat limita os pedidos ou está fora do ar. Tente mais tarde.
- "Estado ... não encontrado no Comex Stat": a lista de estados da API mudou. Peça ajuda ao Claude.
