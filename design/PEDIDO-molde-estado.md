# Pedido ao Claude Design: molde da página de estado (piloto: São Paulo)

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole.

---

O StatWorld ("Os números do mundo, explicados.") já tem a Economia do Brasil com 10 abas: mapa dos 27 estados, ranking e ficha (molde aprovado "1c Mapa e ranking" e as telas da rodada 4, com navegação em dois níveis: grupos em cima, abas do grupo embaixo). Agora vamos descer um nível: **a página de cada estado, com o mapa dos seus municípios**. O piloto é **São Paulo** (645 municípios), mas o molde precisa servir para os 27 estados (Roraima tem 15 municípios, Minas Gerais tem 853).

Use o Design System **StatWorld** (tokens, componentes e ícones) e não crie estilo novo: a página precisa parecer a mesma família das páginas do Brasil. Mesmo cabeçalho, mesmas abas em dois níveis, mesma ficha, mesmos selos ("anual", "mensal"), mesmo carimbo "fonte · data", tema claro e escuro.

## Os problemas que o molde precisa resolver

**1. Ranking com centenas de lugares**
Hoje o ranking mostra os 8 primeiros e um botão "Ver todos os 27 estados". Com 645 municípios isso não funciona. Proposta (pode melhorar):
- **Busca por nome** acima do ranking ("Digite sua cidade"). Muita gente vai querer achar a própria cidade.
- **Filtro por região do estado**: o IBGE divide cada estado em regiões intermediárias (em SP, 11, como "Campinas" e "Ribeirão Preto"). Com o filtro, o ranking e o mapa mostram só aquela região.
- **Posição da cidade escolhida** sempre visível, mesmo longe do topo: "312º de 645".
- Botão para ver **os maiores** ou **os menores**.
- Lista longa com "mostrar mais" (de 50 em 50, por exemplo), sem travar o celular.

**2. Mapa com centenas de pedaços**
- A capital e as cidades em volta ficam minúsculas. Preciso de **zoom** (aproximar e afastar, botões + e −, pinça no celular) e de **"ir até a região"** ao escolher o filtro.
- Ao escolher uma cidade pela busca ou pelo ranking, o mapa aproxima e destaca a cidade.
- No celular, tocar em cidade pequena precisa ser possível (ex.: tocar abre uma lista das cidades daquele ponto, ou a busca é o caminho principal).
- Contornos finos entre municípios e um contorno mais forte entre as regiões.
- "Sem dado" continua com hachura, nunca como zero.

**3. Ficha do município**
Mesma ficha de hoje (nome, valor, posição no estado, média do estado, diferença, fonte e data), e mais:
- **posição no Brasil** quando o dado existir para todos os municípios do país (ex.: "38º de 5.570");
- a **região** a que a cidade pertence;
- um link "Ver página de <cidade>" (a página de município vem depois: hoje pode aparecer "em breve").

**4. Abas que não existem neste nível**
Nem todo dado do Brasil existe por município. A barra de abas continua igual à do Brasil, mas cada aba pode estar de um destes jeitos. Preciso de uma tela para cada um:
- **Mapa dos municípios** (ex.: Visão geral, Agro, Comércio exterior).
- **Só o número do estado, sem mapa dos municípios** (ex.: desemprego, que a pesquisa só mede para o estado inteiro). Mostrar o número do estado, a posição dele entre os 27 e um gráfico no tempo, com um aviso curto do tipo "Este dado não existe por município".
- **Sem dado neste nível** (ex.: Dinheiro e juros, que só existe para o país). Aviso curto e link para a mesma aba do Brasil.
- **Em breve** (fonte existe, página ainda não feita).

**5. Começo da página e caminho**
- Trilha: "Economia / Brasil / São Paulo", com troca de estado (lista dos 27 com busca), no mesmo espírito do seletor de lugar da rodada 3.
- Título: "A economia de São Paulo".
- Um jeito de chegar à página do estado a partir do mapa do Brasil (ex.: na ficha do estado, botão "Ver os municípios de São Paulo").
- Um bloco curto de resumo do estado no topo é bem-vindo, desde que pequeno (o dono tirou as faixas "… hoje" das abas por poluírem a página: não repetir isso).

**6. Números recentes ("Agora") — importante**
O PIB de cada município só sai com 2 anos de atraso, e as pessoas querem números atuais. O molde precisa mostrar, lado a lado e sem confundir, dois tempos:
- **Agora (2026, mensal):** do estado, o PIB mensal do órgão estadual de estatística (crescimento no mês, no ano e em 12 meses, com agro, indústria e serviços) e um índice de atividade do Banco Central, em gráfico no tempo. De cada município, as exportações e os empregos com carteira criados no ano. Selo "mensal", fonte e data; aviso "dados preliminares".
- **Retrato consolidado (anual, mais antigo):** PIB, PIB por pessoa e peso de cada setor por município, com o ano bem visível (ex.: "PIB de 2023 · setores de 2021").
- Proponha onde o "Agora" fica: um bloco compacto no topo da Visão geral, ou uma lente "Ao vivo" (o mapa do site prevê as lentes Dados · Ao vivo · História). Lembre: o dono tirou as faixas "… hoje" porque poluíam; o bloco precisa ser enxuto.
- Na ficha do município, os números de anos diferentes precisam mostrar o ano de cada um.
- Um contador "ao vivo" do PIB do estado só pode existir com o selo **"estimativa"**; mostre como ficaria, se fizer sentido.

## Telas que preciso (claro e escuro, desktop 1440 e celular 375)
1. Visão geral de São Paulo: mapa dos municípios + ranking + ficha, com uma cidade escolhida.
2. Busca aberta, com o resultado escolhido e o mapa aproximado.
3. Filtro por região ativo (mapa e ranking só daquela região).
4. Ranking aberto ("mostrar mais"), com a cidade escolhida fora do topo.
5. Aba "só o número do estado" (ex.: Trabalho, desemprego).
6. Aba "sem dado neste nível" (ex.: Dinheiro e juros).
7. Troca de estado aberta na trilha.
8. O bloco "Agora" (ou a lente "Ao vivo") de São Paulo, com o gráfico mensal, e a ficha de um município com números de 2026 e de 2023 juntos.
9. A mesma Visão geral para um estado pequeno (Roraima, 15 municípios), para ver que o molde funciona nos dois extremos.

## Restrições
- **Nada exclusivo de São Paulo**: nome do estado, número de municípios, regiões e cores vêm de configuração. O molde precisa servir para os 27 estados e, no futuro, para outros países (condados dos EUA, por exemplo).
- Nada de números inventados nas telas: use textos de exemplo claramente marcados (ex.: "00,0%", "000º de 000"), com o selo "exemplo".
- Funcionar com teclado e leitor de tela.
- No celular: textos curtos e a ordem mapa → ficha → ranking, como nas páginas atuais.
- Espaço de anúncio só abaixo do bloco mapa + ranking, nunca junto do mapa, da ficha ou dos gráficos.

---

Quando receber, coloque os arquivos numa pasta nova `design/rodada-5-estado/` e avise o Claude.
