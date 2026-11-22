# Script: serviços por estado e atividade

## O que faz
Baixa do IBGE, para cada estado e cada uma das **7 atividades de serviços**, o **valor adicionado bruto** de um ano: quanto a atividade acrescenta à economia (é a parte de cada atividade dentro do PIB). Também guarda o **crescimento real** de cada atividade (já sem inflação), para uso futuro.

| Atividade no site | Grupo |
|---|---|
| Comércio (inclui reparação de veículos) | Serviços de mercado |
| Transporte, armazenagem e correio | Serviços de mercado |
| Informação e comunicação | Serviços de mercado |
| Atividades financeiras e seguros | Serviços de mercado |
| Atividades imobiliárias | Serviços de mercado |
| Outros serviços (alojamento e alimentação, educação e saúde privadas, serviços profissionais, artes, serviços domésticos…) | Serviços de mercado |
| Administração, educação e saúde públicas | Serviços públicos |

## De onde vêm os dados
**IBGE, Contas Regionais do Brasil**, arquivo "Conta da produção" (`Conta_da_Producao_2010_AAAA_xls.zip`) em https://ftp.ibge.gov.br/Contas_Regionais/
É a mesma pesquisa do PIB por estado da Visão geral, então os números batem com ela. Não há sigilo.

## Cuidados
- **Atividades imobiliárias** incluem o "aluguel imputado": o valor que os donos de imóveis "pagariam" se alugassem a própria casa. É uma convenção das contas nacionais, e por isso essa atividade é grande.
- **Outros serviços** é um grupo variado. Ser o "líder" não significa que um único tipo de serviço seja o maior.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/servicos-estados/baixar.mjs
```

## O que ele cria
`dados/servicos/brasil-estados.json`. Não edite à mão.

## Quando rodar de novo
Uma vez por ano, em novembro, junto com o script do PIB por estado (`pib-estados`). No topo de `baixar.mjs`, troque `ANO` e `DATA_DIVULGACAO`.

## Se der erro
- "Não achei o bloco" ou "não achei a aba": o IBGE mudou o formato da planilha. Peça ajuda ao Claude.
- "Esperava 27 estados": idem.
