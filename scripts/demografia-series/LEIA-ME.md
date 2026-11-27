# Script: Demografia no tempo e migração

## O que faz
Junta, para o **Brasil** e os **27 estados**:

| Parte | Fonte | Anos |
|---|---|---|
| Pirâmides etárias (17 faixas de 5 anos, a última 80+) | IBGE, Censos (tabela 200, amostra) + Censo 2022 (de `scripts/populacao/`) + **Projeções da População, revisão 2024** | 1980, 1991, 2000, 2010, 2022, 2030, 2040, 2050, 2060, 2070 |
| Nascimentos, óbitos, esperança de vida (homens e mulheres), filhos por mulher | IBGE, Projeções da População, revisão 2024 (planilha `tab4_indicadores`) | 2000 a 2070, ano a ano |
| Nascidos vivos registrados e óbitos | IBGE, Estatísticas do Registro Civil (tabelas 2609 e 2654) | 2015 a 2024, e o último ano também **por município** |
| Migração: moradores de cada estado pelo estado onde nasceram | IBGE, Censo 2022 (tabela 631) | 2022 |

**Projeção não é medição.** No site, os anos depois de 2022 levam o selo "Projeção", com as barras mais claras e as linhas tracejadas. As projeções vêm da **revisão 2024**, que é mais nova que a revisão 2018 do Sidra. Ela fica num servidor de arquivos do IBGE: https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024/

**Registro Civil:** conta os registros. Nascimentos registrados com atraso entram em anos seguintes. Os números são pelo lugar onde a pessoa mora.

**Migração:** diz onde a pessoa mora e onde nasceu, mas **não quando se mudou**. O site calcula:
- a % de moradores nascidos em outro estado;
- quantos nascidos no estado moram fora;
- o saldo (chegaram − saíram);
- os maiores caminhos entre estados.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/demografia-series/baixar.mjs
```

Rode `scripts/populacao/` antes, porque a pirâmide de 2022 vem de lá. O script demora alguns minutos.

## O que ele cria
- `dados/demografia/brasil-series.json`: pirâmides, projeção, Registro Civil e migração (Brasil e estados).
- `dados/demografia/brasil-municipios-vital.json`: nascimentos e óbitos do último ano, por município.

## Conferido (27 nov 2026)
- População do Brasil em 1980: 118,9 milhões.
- Registro Civil de 2024: 2,42 milhões de nascimentos e 1,49 milhão de óbitos.
- Esperança de vida projetada para 2026: 77,0 anos.
- Maior caminho de migração: da Bahia para São Paulo, 1,84 milhão de pessoas.

## Quando rodar de novo
- **Registro Civil:** uma vez por ano. O IBGE publica o ano anterior perto de dezembro; o script pega sozinho o último ano com dado (ajuste `ANOS_RC` para incluir anos novos).
- **Projeções:** quando sair uma revisão nova. Troque `FTP_PROJ` e a data em `fontes.projecao`.

## Se der erro
- "A planilha ... mudou": o IBGE mudou as colunas. Peça ajuda ao Claude.
- "O IBGE não respondeu": o Sidra está lento. Tente mais tarde.
