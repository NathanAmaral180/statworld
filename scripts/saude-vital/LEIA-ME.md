# Script: nascer e morrer (tema Saúde)

## O que faz
Busca no **Ministério da Saúde**, pelo TabNet do DATASUS, os números de nascimentos e mortes do **Brasil**, dos **estados** (de 2015 até o último ano) e dos **municípios** de um estado (padrão SP, nos últimos 4 anos).

| Medida | De onde vem | Conta |
|---|---|---|
| Nascidos vivos, pré-natal com 7+ consultas, cesáreas, mães com até 19 anos, baixo peso (< 2,5 kg) | SINASC | % dos nascidos vivos, pela residência da mãe |
| Mortalidade infantil | SIM + SINASC | óbitos de menores de 1 ano ÷ nascidos vivos × 1.000 |
| Mortes por capítulo da CID-10 (coração, câncer, causas externas…) | SIM | óbitos pela residência |
| **Mortes padronizadas por idade** | SIM + IBGE | **cálculo nosso**, pelo método direto: 11 faixas de idade, com a população padrão do Brasil no Censo 2022. Assim um lugar com mais idosos não aparece "pior" só por isso. A população por idade dos estados vem das Projeções do IBGE (revisão 2024); a dos municípios, da pirâmide do Censo 2022 ajustada à estimativa do ano |
| Mortes maternas | SIM | óbitos do capítulo XV da CID-10. É uma aproximação, porque inclui as mortes maternas tardias |

**O último ano é preliminar:** o Ministério ainda recebe registros, e o site mostra o selo "Preliminar". O ano corrente, incompleto, fica de fora.

## De onde vem
- TabNet do DATASUS: http://tabnet.datasus.gov.br. O script monta o mesmo pedido que o navegador faria (`scripts/lib/tabnet.mjs`).
- População por idade: https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024/
- Também usa `dados/demografia/` (Censo 2022, pirâmides dos municípios), então rode antes `scripts/populacao/` e `scripts/piramides-municipios/`.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/saude-vital/baixar.mjs
```

Demora uns 10 minutos, porque são cerca de 150 consultas ao TabNet. Para outro estado: `$env:UF="MG"; node scripts/saude-vital/baixar.mjs`.

## O que ele cria
- `dados/saude/brasil-vital.json`: Brasil (`BR`) e estados, ano a ano.
- `dados/saude/brasil-<uf>-vital.json`: municípios.

## Conferido (27 nov 2026)
Brasil 2024:
- 2.389.325 nascidos vivos e 30.020 óbitos de menores de 1 ano, ou seja, **12,6 por mil**;
- 60,6% de cesáreas;
- 79,1% com 7 ou mais consultas de pré-natal.

## Se der erro
"O TabNet não respondeu": o DATASUS está lento ou fora do ar. Tente mais tarde. Se o nome de algum campo mudar, peça ajuda ao Claude.
