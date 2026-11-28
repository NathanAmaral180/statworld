# Script: como as pessoas estão (tema Saúde)

## O que faz
Busca no IBGE (Sidra) os resultados da **Pesquisa Nacional de Saúde 2019**: quanto da população de 18 anos ou mais
- avalia a própria saúde como boa ou muito boa;
- tem doenças crônicas diagnosticadas: pressão alta, diabetes, colesterol alto, depressão, asma e doença do coração;
- tem certos hábitos: fumar, atividade física, frutas e hortaliças, álcool e obesidade.

Vem para o Brasil e os estados, para o total, homens e mulheres, sempre **com o intervalo de confiança** publicado pelo IBGE. A obesidade só existe para o Brasil.

**É uma pesquisa por amostra:** cada número tem margem de erro, e não existe por município.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/saude-pns/baixar.mjs
```

## O que ele cria
`dados/saude/brasil-pns.json`

## Conferido (27 nov 2026)
Brasil 2019:
- pressão alta: 23,9%;
- fumantes: 12,6%;
- obesidade: 25,9%;
- saúde boa ou muito boa: 66,1%.

## Quando rodar de novo
Quando o IBGE publicar uma nova edição da pesquisa: troque `ANO` e confira as tabelas.
