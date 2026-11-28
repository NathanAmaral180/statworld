# Script: rede de saúde (tema Saúde)

## O que faz
Busca no **CNES** (Ministério da Saúde, pelo TabNet do DATASUS), no mês mais recente:
- **médicos** (todas as ocupações que começam com "Médico") e **enfermeiros** com cadastro ativo;
- leitos de internação **SUS** e **não SUS**;
- leitos de **UTI**.

Faz isso para o Brasil, os estados e os municípios de um estado (padrão SP). Divide pela população estimada pelo IBGE: por mil habitantes (UTI por 10 mil).

**Profissionais são vínculos:** um médico que trabalha em dois lugares conta nos dois. O site avisa isso.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/saude-rede/baixar.mjs
```

## O que ele cria
`dados/saude/brasil-rede.json` (Brasil e estados) e `dados/saude/brasil-<uf>-rede.json` (municípios).

## Conferido (27 nov 2026, CNES de outubro de 2026)
Brasil: 2,97 médicos e 3,11 enfermeiros por mil habitantes; 1,49 leito SUS por mil; 3,87 leitos de UTI por 10 mil.

## Quando roda
Todo mês o CNES publica um mês novo, e o script pega sozinho o mais recente.

## Se der erro
- "O TabNet devolveu a tabela de UTI vazia": o DATASUS mudou o nome do campo no formulário de leitos de UTI. Abra http://tabnet.datasus.gov.br/cgi/deftohtm.exe?cnes/cnv/leiutisp.def, veja o nome em "Conteúdo" e troque em baixar.mjs (hoje: Quantidade_existente, igual no Brasil e nos estados).
