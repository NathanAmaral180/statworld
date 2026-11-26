# Script: bandeiras do estado e dos municípios

## O que faz
Busca a bandeira do estado (o padrão é São Paulo) e a de cada município, para a página do estado:
- a do estado aparece pequena, antes do título "A economia de São Paulo";
- a da cidade aparece na ficha, ao lado do nome, com o crédito embaixo;
- **nunca no mapa nem no ranking**, para não poluir.

## De onde vêm
1. **Wikidata**: diz qual arquivo é a bandeira de cada lugar (propriedade P41). O estado é achado pelo código ISO ("BR-SP") e o município pelo código do IBGE.
2. **Wikimedia Commons**: o arquivo da bandeira, com o autor e a licença.

**Só entram bandeiras com licença livre** (domínio público ou Creative Commons). As outras ficam de fora e aparecem em `recusadas`. Cidade sem bandeira simplesmente não mostra bandeira.

O script baixa uma imagem pequena (96 px de largura) de cada bandeira para `public/bandeiras/br/<uf>/`. Assim o site não depende do Commons para funcionar.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/bandeiras-municipios/baixar.mjs
```

Demora alguns minutos: o Commons limita pedidos seguidos, então o script faz pausas.

Para outro estado:

```
$env:UF="MG"; node scripts/bandeiras-municipios/baixar.mjs
```

Depois, cadastre o arquivo em `src/config/paises/brasil.json`, em `estados.comPagina.<UF>.arquivos.bandeiras`.

## O que ele cria
- `dados/geo/brasil-<uf>-bandeiras.json`: para cada lugar, o arquivo, o crédito (autor e licença) e o link da página no Commons.
- As imagens, em `public/bandeiras/br/<uf>/<código>.png`. O estado fica em `estado.png`.

## Quando rodar de novo
De vez em quando (uma vez por ano basta): voluntários do Wikidata e do Commons vão acrescentando bandeiras.

## Se der erro
- "Sem resposta de ...": o Wikidata ou o Commons estão limitando pedidos. Espere alguns minutos e rode de novo.
- "Estado desconhecido": confira a sigla em `UF`.
