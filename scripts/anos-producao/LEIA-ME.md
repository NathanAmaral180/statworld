# Script: anos antigos do Agro e da Indústria

## O que faz
Baixa os **anos antigos** do Agro (lavouras + pecuária) e da Indústria, para o seletor de ano e o botão "ver a evolução" do site.
Ele roda os scripts de sempre (`lavouras-estados`, `pecuaria-estados`, `industria-estados`) **uma vez por ano**, e salva cada ano num arquivo separado. O ano mais recente continua no arquivo de sempre (não é tocado aqui).

| Tema | Anos | Por quê |
|---|---|---|
| **Agro** | 2017 até o ano anterior ao mais recente | As carnes (bovinos, suínos, frango) vêm da planilha do MAPA (Valor Bruto da Produção), que começa em 2017. Lavouras e pecuária precisam ser do mesmo ano para o "produto líder" fazer sentido. |
| **Indústria** | 2007 até 2023 | 2007–2023: série anterior da Pesquisa Industrial Anual (tabela 1849 do Sidra). 2024 em diante: série nova (tabela 10457). Mesma medida (valor da transformação industrial) e mesmos 29 setores, mas o IBGE mudou a pesquisa: a ficha avisa para comparar com cuidado. |

## De onde vêm os dados
Os mesmos de cada script: IBGE (PAM, tabela 5457; PPM, tabela 74; PIA, tabelas 1849 e 10457) e MAPA (VBP). Ver o LEIA-ME de cada um.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/anos-producao/baixar.mjs
```

Demora uns minutos. Cada linha mostra o tema, o ano e "ok".

## O que ele cria
- `dados/agro/anos/brasil-estados-lavouras-AAAA.json` e `dados/agro/anos/brasil-estados-pecuaria-AAAA.json`
- `dados/industria/anos/brasil-estados-AAAA.json`

Não edite à mão; rode de novo.

## Quando rodar de novo
Uma vez por ano, **depois** de atualizar o ano mais recente nos scripts de sempre (quando o ano mais recente muda, o ano que era o último vira "antigo" e precisa ganhar o seu arquivo aqui).

## Como funciona por dentro
Cada script aceita duas "variáveis de ambiente": `ANO` (o ano a baixar) e `SAIDA` (onde salvar). Sem elas, o script faz o de sempre (ano mais recente, arquivo de sempre).

## Se der erro
- Erro de um ano específico: o site do IBGE ou do MAPA pode estar fora do ar. Tente de novo mais tarde.
- "Setor novo na tabela": o IBGE mudou a lista de setores naquele ano. Peça ajuda ao Claude.
- "não tem o ano" no MAPA: a planilha do VBP mudou de formato ou deixou de ter aquele ano.
