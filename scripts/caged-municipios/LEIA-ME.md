# Script: empregos com carteira por município (Novo Caged)

## O que faz
Calcula, para **cada município do Brasil**, o saldo de empregos com carteira (admissões menos desligamentos):
- de cada mês do ano em curso;
- **acumulado no ano**.

A conta é a mesma do script dos estados (`scripts/caged-estados/`), que bate com os números oficiais. Este faz a soma por município em vez de por estado.

Os arquivos do Ministério são grandes (cerca de 50 MB por mês). Por isso o script **guarda os meses já calculados** e, a cada vez que roda, só baixa os meses novos. Quando o ano muda, ele começa do zero no ano novo.

## O acumulado do ano pode diferir um pouco do oficial
O acumulado é a soma dos saldos mensais declarados no prazo. O Ministério, no acumulado oficial, inclui também declarações fora do prazo e exclusões. A diferença costuma ser pequena, mas existe. O arquivo explica isso (`calculo`).

## De onde vêm os dados
Microdados do Novo Caged, servidor oficial do Ministério do Trabalho e Emprego: ftp://ftp.mtps.gov.br/pdet/microdados/NOVO%20CAGED/

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/caged-municipios/baixar.mjs
```

A primeira vez demora, porque baixa todos os meses do ano. Depois, só o mês novo.

## O que ele cria
`dados/trabalho/brasil-municipios-caged.json`. A chave é o código do município com **6 dígitos**, que são os 6 primeiros do código do IBGE (o Caged não usa o último dígito). Não edite à mão.

## Quando roda
Uma vez por semana (às segundas), na rotina automática, junto com o Caged por estado.

## Se der erro
- "O arquivo do Caged mudou de formato": o Ministério mudou as colunas. Peça ajuda ao Claude.
- "Não achei meses na pasta": o servidor do Ministério está fora do ar ou mudou de endereço. Tente mais tarde.
