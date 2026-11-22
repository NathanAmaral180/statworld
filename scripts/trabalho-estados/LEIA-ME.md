# Script: Trabalho e renda (desemprego e renda média)

## O que faz
Baixa do IBGE os números da **PNAD Contínua** (pesquisa do IBGE sobre trabalho):

| No site | De onde vem | Frequência |
|---|---|---|
| **Desemprego por estado** (mapa e ranking) | Tabela [4099](https://sidra.ibge.gov.br/tabela/4099): taxa de desocupação, trimestre mais recente | trimestral |
| **Renda média do trabalho por estado** (na ficha) | Tabela [5436](https://sidra.ibge.gov.br/tabela/5436): rendimento médio mensal real habitual, em todos os trabalhos (sexo: total) | trimestral |
| **Desemprego do Brasil, mês a mês desde 2012** (gráfico) | Tabela [6381](https://sidra.ibge.gov.br/tabela/6381) (trimestre móvel) | mensal |
| **Renda média do Brasil, mês a mês desde 2012** (gráfico) | Tabela [6390](https://sidra.ibge.gov.br/tabela/6390) (trimestre móvel) | mensal |

- **Desemprego** = parte das pessoas de 14 anos ou mais que procuraram trabalho e não encontraram, entre as que trabalham ou procuram trabalho.
- **Renda "real"** = o IBGE corrige os valores antigos pela inflação, até o período mais recente. Por isso dá para comparar anos diferentes.
- **"Trimestre móvel"**: cada ponto mensal é a média dos 3 meses que terminam naquele mês (ex.: "jul-ago-set 2026").
- A **data de divulgação** vem do próprio IBGE (data de atualização de cada período). Nada é digitado à mão.

Os dados vêm da API do IBGE (servicodados.ibge.gov.br), que entrega as mesmas tabelas do Sidra.

## Como rodar
Na pasta `statworld`:

```
node scripts/trabalho-estados/baixar.mjs
```

Deve aparecer algo como: `Pronto: 3º trimestre 2026 (divulgado em 2026-11-18); série mensal até jul-ago-set 2026.`

## O que ele cria
- `dados/trabalho/brasil-estados.json`: desemprego e renda por estado, com o valor do Brasil.
- `dados/trabalho/brasil-series.json`: as duas séries mensais do Brasil.

Não edite esses arquivos à mão; rode o script de novo.

## Quando rodar de novo
- **Por estado:** a cada trimestre (o IBGE divulga em meados de fevereiro, maio, agosto e novembro).
- **Séries do Brasil:** todo mês (no fim do mês).
Basta rodar o comando; o script pega sozinho o período mais recente.

## Se der erro
- "O IBGE respondeu com erro": o site do IBGE pode estar fora do ar. Tente mais tarde.
- "estão em trimestres diferentes": o IBGE atualizou uma tabela e ainda não a outra. Rode de novo no dia seguinte.
- "valores sem dado": o site mostra esses estados com hachura. Não é erro, mas vale conferir no Sidra.

## O que ficou de fora (por enquanto)
**Empregos com carteira criados no mês (Novo Caged, Ministério do Trabalho).** Em 2026 o Ministério publica esses números por estado só em PDF e em arquivos brutos muito grandes, e não mais em planilha. Para entrar no site, é preciso um script que leia os arquivos brutos (microdados).
