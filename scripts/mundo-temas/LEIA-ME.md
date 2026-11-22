# Script: um número do mundo por tema (página inicial)

## O que faz
Baixa do Banco Mundial o número mais recente **do mundo** para cada cartão de tema da página inicial:

| Tema | Indicador do Banco Mundial | Dado original de |
|---|---|---|
| Economia | PIB mundial (NY.GDP.MKTP.CD) | Banco Mundial e OCDE |
| Saúde | Expectativa de vida ao nascer (SP.DYN.LE00.IN) | ONU, World Population Prospects |
| Política | Cadeiras de parlamentos ocupadas por mulheres (SG.GEN.PARL.ZS) | União Interparlamentar |
| Demografia | População mundial (SP.POP.TOTL) | ONU, World Population Prospects |

## De onde vêm os dados
API aberta do Banco Mundial (Indicadores de Desenvolvimento Mundial, WDI): https://data.worldbank.org/ — sem cadastro.
O script pega o ano mais recente que tem valor e a data em que o Banco Mundial atualizou o indicador.

## Como rodar
```
node scripts/mundo-temas/baixar.mjs
```

## O que ele cria
`dados/mundo/temas.json`. Não edite à mão. Se um indicador vier sem valor, ele fica como "sem dado".

## Quando rodar de novo
De tempos em tempos (o Banco Mundial atualiza esses números algumas vezes por ano).

## Se der erro
- "respondeu com erro": a API do Banco Mundial pode estar fora do ar. Tente mais tarde.
