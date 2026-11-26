# Atualização automática dos dados

## O que é
Um "robô" no GitHub que, **todo dia às 7h (horário de Brasília)**:
1. roda os scripts de dados que mudam com frequência (lista abaixo);
2. confere se o site continua funcionando (`npm run build`);
3. se algum **número** mudou, grava os dados novos no GitHub. A Cloudflare então publica o site sozinha, como sempre.

Se nenhum número mudou, ele não grava nada (não fica publicando o site à toa).

A rotina está em `.github/workflows/atualizar-dados.yml`. O programa que roda os scripts é `scripts/atualizar/rodar.mjs`.

## O que ele atualiza
| Dados | Quando roda | Com que frequência a fonte muda |
|---|---|---|
| Faixa "Agora" da página inicial (dólar, Selic, IPCA) | todo dia | diária |
| Dinheiro e juros (Banco Central) | todo dia | diária e mensal |
| Preços (IPCA, cesta básica, salário mínimo) | todo dia | mensal |
| Trabalho e renda (PNAD Contínua) | todo dia | mensal e trimestral |
| Comércio exterior (Comex Stat) | todo dia | mensal |
| Contas públicas (Tesouro, Banco Central) | todo dia | mensal e anual |
| Empregos com carteira (Novo Caged) | segundas-feiras (arquivo grande) | mensal |
| SP: atividade econômica mensal (Seade, Banco Central) | todo dia | mensal |
| SP: exportações e importações por município (Comex Stat) | todo dia | mensal |
| Empregos com carteira por município (Novo Caged) | segundas-feiras (só baixa os meses novos) | mensal |

Rodar todo dia não faz mal: se a fonte ainda não publicou nada novo, nada muda no site.

## O que continua à mão (uma vez por ano)
Estes dados saem uma vez por ano e o script precisa saber qual é o ano novo (linha `ANO` no começo de cada `baixar.mjs`):

| Dados | Script | Quando sai o ano novo |
|---|---|---|
| PIB dos estados | `pib-estados` | novembro (IBGE) |
| Lavouras e pecuária | `lavouras-estados`, `pecuaria-estados` | setembro/outubro (IBGE) |
| Indústria | `industria-estados` | meados do ano (IBGE) |
| Serviços | `servicos-estados` | novembro (IBGE, junto com o PIB dos estados) |
| Temas da página inicial (mundo) | `mundo-temas` | quando o Banco Mundial atualiza |

Também à mão:
- a data de divulgação de cada mês do **Novo Caged** (`scripts/caged-estados/`). O robô funciona sem ela, mas o site mostra o número sem a data até alguém digitá-la;
- as **metas de inflação** quando o Conselho Monetário Nacional mudar a meta (`scripts/precos/`).

## Como ver se está funcionando
No site do GitHub, abra o repositório **statworld** e clique em **Actions**. Lá aparece cada execução da rotina "Atualizar dados":
- **Verde:** deu certo. Clique na execução para ver o resumo: quais dados tinham números novos e quais avisos apareceram.
- **Vermelho:** algo falhou, e nesse caso **nada foi publicado** (o site fica como estava). O GitHub manda um e-mail avisando. Peça ajuda ao Claude com o link da execução.

Se um script falhar e os outros não, os outros são publicados normalmente; o resumo mostra qual falhou.

## Como rodar na hora
- **No GitHub:** aba **Actions**, depois **Atualizar dados**, depois o botão **Run workflow**. Dá para marcar "rodar também os semanais".
- **No computador** (na pasta `statworld`):

```
node scripts/atualizar/rodar.mjs
```

Para incluir o Novo Caged:

```
node scripts/atualizar/rodar.mjs --semanal
```

## O que os testes mostraram (23 nov 2026)
- **Funcionam no robô:** Banco Central (dólar, Selic, crédito, dívida), IBGE (PNAD, IPCA), Ipeadata (cesta básica, salário mínimo), Comex Stat e o servidor do Novo Caged.
- **Site do Tesouro Transparente:** às vezes responde "403" (acesso negado), inclusive de computadores no Brasil, provavelmente uma proteção depois de muitos pedidos. Por isso o script de Contas públicas mantém os arquivos do Tesouro quando o site não responde. Esses dados mudam uma vez por ano, e a dívida, que vem do Banco Central, continua sendo atualizada. O resumo da execução mostra um aviso quando isso acontece.
- A rotina também roda sozinha sempre que um script de dados é alterado no GitHub. Assim, cada mudança nos scripts é testada na hora.

## Cuidados
- O GitHub pausa rotinas automáticas de repositórios sem nenhuma atividade por 60 dias. Se isso acontecer, ele avisa por e-mail; basta clicar para reativar.
- Alguns sites do governo às vezes bloqueiam ou demoram para responder a computadores fora do Brasil (onde o GitHub roda). Se um script falhar sempre no robô e funcionar no seu computador, é isso. Avise o Claude.
