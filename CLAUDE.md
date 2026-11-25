# StatWorld — regras permanentes

StatWorld: "Os números do mundo, explicados." Site de dados globais feito com Astro.
Primeiro tema: Economia. Primeiro país: Brasil.

## Mapa do site e princípios (fonte: `docs/StatWorld · Mapa do site (esqueleto completo).md`)
O mapa do site é o esqueleto completo: princípios, molde de página, 20 temas em 5 grupos e as 10 abas de Economia. Os princípios valem para qualquer tema e país:
1. **Um molde só.** O Brasil é o modelo. Mapa, ranking, ficha, gráfico de série e "de onde vem cada R$ 100" funcionam para todos os temas e países.
2. **Páginas nascem de cadastro.** Tema, aba, indicador e território são registros num catálogo (`src/config/catalogo.json`). Página nova = uma linha no cadastro + os dados, sem desenho novo. Não escreva listas de temas ou abas dentro das páginas.
3. **Todo número tem fonte, data e selo de frequência** (anual, mensal, diário, ao vivo). Nenhum número fica escrito dentro de uma página.
4. **"Sem dado" é um estado próprio**, com hachura, nunca zero.
5. **Três lentes em toda entidade:** Dados (consolidado), Ao vivo (só com fonte frequente; contador estimado leva o rótulo "estimativa") e História (texto com gráficos).
6. **Classificações internacionais desde o início**, para comparar países: ISIC (indústria), FAO (agro), CID (saúde), COFOG (gasto público), ISCED (educação).
7. **Comparação entre países em paridade de poder de compra (PPC)**, além da moeda local.
8. **Medir pelo que é comparável:** o produto que mais se produz num estado é medido em valor (R$), nunca em toneladas.
9. **Documentação como regra:** cada fonte de dados tem um LEIA-ME em português simples; este arquivo guarda os princípios.

**Molde de página (6 níveis):** Início (mundo) → Tema → País → Estado/região → Município → Entidades transversais (produto, empresa, instituição). Cada indicador declara em que níveis existe; fora deles a página mostra "sem dado neste nível". Endereços previstos no mapa: `/br/economia`, `/br/sp/economia`, `/br/sp/campinas/economia`, `/produtos/soja`, `/empresas/petrobras` (o site hoje usa outros — ver "Diferenças" abaixo). Selos: frequência, "estimativa", "exemplo" (só em desenho), "pendente de conferência". Barra de abas em grupos com rótulo discreto, sem quebra de linha (no celular, rolagem lateral).

**Fontes do mapa:** todas as fontes candidatas estão **"a verificar"**. Não use números delas sem conferir na fonte oficial e registrar fonte e data.

**Diferenças conhecidas entre o site e o mapa (decidir antes de mudar):** a Visão geral não tem a medida de impostos (o mapa prevê; o dono tirou para não repetir a aba Impostos); endereços (`/economia`, `/economia/agro/soja`, `/estados-unidos/economia`); Serviços mede valor adicionado das Contas Regionais (o mapa prevê receita e emprego da PAS/PMC/PMS e RAIS); páginas de estado e de município e as lentes Ao vivo/História ainda não existem; não há bolsa nem "ao vivo" em Dinheiro e juros (sem fonte oficial liberada); PPC ainda não aplicada. Já existem: selo de frequência e fonte · data ao lado dos botões, gráfico de série (`GraficoSerie`), composição "cada R$ 100" (`CadaCem`) e classificações internacionais em Comércio exterior (CUCI) e Contas públicas (COFOG).

**SEO e páginas do site:** cada aba tem `descricao` própria na config (`src/config/temas/*.json`, e `descricaoProduto` nas páginas de produto/setor/atividade); mapa do site automático (`@astrojs/sitemap`, endereço em `astro.config.mjs` → trocar junto com o domínio, e também em `public/robots.txt`); página de erro `src/pages/404.astro` (a Cloudflare a usa por causa do `wrangler.jsonc`: `not_found_handling: "404-page"`; o nome do worker ali é "statworld" e não pode mudar). Textos com números na página inicial vêm dos dados (nunca digitar números).

## Publicidade e privacidade
- O site vai se financiar com anúncios e outras fontes: páginas patrocinadas (sempre com o selo "patrocinado"), dados e API pagos, apoio de leitores. **Hoje nenhuma rede de anúncios está ativa**: os espaços só reservam o lugar.
- Configuração: `src/config/anuncios.json` (`ativo: false`, `rede: null`, tamanhos de cada posição). Componente: `src/componentes/EspacoAnuncio.astro`. Ele tem tamanho fixo (a página não pula ao carregar) e o rótulo "Publicidade", funciona no tema claro e no escuro, e hoje mostra só um bloco cinza neutro.
- **Regras:**
  - anúncio nunca fica junto do mapa, dos gráficos ou da ficha;
  - nunca imita um dado ou um botão (nada de números, cores de dado ou bordas de botão no espaço);
  - nenhum anunciante influencia o que o dado mostra.
- **Posições:**
  - colunas laterais em telas bem largas (no `Base.astro`, fora da área de 1440px; somem abaixo de 1840px);
  - abaixo do bloco mapa + ranking (`posicao="abaixo-ranking"`, 728×90 e 320×100 no celular), nos moldes `PaginaEconomia`, `PaginaAgro` e `PaginaProdutoAgro`;
  - entre capítulos da página de História (`posicao="entre-capitulos"`, 300×250), quando ela existir.
  - Página sem anúncio: `<Base semAnuncios>`.
- **Consentimento (LGPD):** o aviso de cookies (`src/componentes/AvisoCookies.astro`) guarda a escolha no navegador (`localStorage` "consentimento") e avisa pelo evento `statworld:consentimento`. **Nenhum script ou cookie de anúncio pode ser carregado antes de `anuncios === true`.** O rodapé de todas as páginas tem "Privacidade" e "Preferências de cookies", que reabre o aviso.
- **Política de privacidade:** `/privacidade` (`src/pages/privacidade.astro`), um modelo que o dono vai revisar. Trechos entre [colchetes] precisam ser preenchidos antes de ativar anúncios. Ao ativar uma rede, atualize a política (nome da rede, link da política dela) e a data da versão.

## Quem é o dono do projeto
- O dono não programa. Fale sempre em **português simples**, sem jargão (ou explicando o jargão).
- **Sempre termine dizendo qual é o próximo passo.**
- Não invente dados. Se faltar algo, pergunte.

## Regras dos números
1. **Todo número no site precisa de fonte e data.** Fonte = quem publicou; data = quando foi divulgado e a que período se refere.
2. **Nenhum número fica escrito direto dentro de uma página** (`src/pages`) ou componente (`src/componentes`). Todo número vem de arquivos na pasta `dados/`.
3. **"Sem dado" é um estado próprio, nunca zero.** Nos arquivos, use `null`. Na tela, mostre "sem dado" (no mapa, com hachura). Nunca trate ausência como 0 em cálculos, ordenações ou médias.
4. Números de exemplo das telas de design (pasta `design/`) **não estão conferidos** e não podem ir para o site.

## Regras dos scripts
- Todo script de dados (pasta `scripts/`) ganha um **LEIA-ME em português simples**: o que busca, de onde (link), como rodar, que arquivo gera em `dados/`, o que fazer se der erro.

## Regras do molde (para replicar em outros países)
- Mapa, ranking, ficha e gráfico **não podem depender de nada exclusivo do Brasil**.
- Moeda, idioma, formato de número e níveis geográficos (país, região, estado, município) ficam em configuração: `src/config/paises/<pais>.json`.
- Textos do site e país padrão ficam em `src/config/site.json`. Temas, abas, grupos e subdivisões ficam no cadastro `src/config/catalogo.json` (lido por `src/lib/catalogo.ts`); o arquivo do país diz quais abas aquele país já tem (`subtemas`).
- Para outro tema: troca-se só a medida, os cortes e a legenda. Mapa, ficha, ranking e cores ficam iguais.

## Visual (guia: `design/LEIA-ME-design-1abc.md`)
- **Design System StatWorld** (claude.ai, privado): https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD — feito a partir deste código (cores, tipografia, componentes, 81 ícones). Pedidos ao Claude Design devem usar esse Design System. Se mudar cores, componentes ou ícones no site, atualize-o também.
- **Tema claro e escuro**, usando apenas as cores do guia, definidas como variáveis em `src/estilos/global.css`. Não use cores soltas fora dessas variáveis.
- Fonte do sistema, números tabulares (`font-variant-numeric: tabular-nums`).
- Layout de referência aprovado: **1c Mapa e ranking** (`design/1c-mapa-ranking.png` e `design/rodada-2-agro/`).
- **Ranking recolhido em todas as páginas de mapa** (decisão do dono): mostra os 8 primeiros e o botão "Ver todos os 27 estados"; o lugar escolhido no mapa aparece na lista mesmo fora dos 8. **No computador, o mapa fica preso na tela** enquanto a pessoa desce pelo ranking (no celular, não). Tudo em `MapaRanking.astro`.
- Estados pequenos com linha de chamada (RN, PB, PE, AL, SE, DF, ES, RJ); passar o mouse = prévia, clicar = fixa.
- **Celular (até 640px): textos curtos, computador: completos.** Abas: `nomeCurto` no catálogo; botões de vista: `rotuloCurto` na config da aba (e no arquivo do país quando ele troca as medidas). Classes `.so-pc` / `.so-cel` em `global.css`. Até 760px: ordem mapa → ficha → ranking → legenda; abas (nível 2) e botões de vista presos no topo ao rolar (`--topo-fixo`, de `Abas.astro`); tocar no ranking sobe até o mapa e a ficha; legenda compacta; "Fonte e como calculamos" recolhida. Botão de tema vira ícone. Progresso do projeto: `/admin` (`src/config/progresso.json`).

## Estrutura de pastas
- `dados/` — arquivos de dados (JSON) com fonte e data.
- `scripts/` — programas que buscam dados nas fontes oficiais.
- `src/componentes/` — peças reutilizáveis (cabeçalho, mapa, ranking, ficha, gráfico).
- `src/pages/` — páginas do site (o Astro exige este nome em inglês; cada arquivo vira um endereço).
- `src/layouts/` — moldura comum das páginas.
- `src/componentes/mapa-ranking/` — molde mapa + ranking + ficha. `visao.ts` define a "visão" (cores, legenda, ranking, fichas) e desenha; `construir-indicador.ts` (valor numérico, ex.: PIB) e `construir-producao.ts` (produtos por lugar, ex.: lavouras) montam as visões no servidor.
- `src/componentes/Abas.astro` — abas (Visão geral / Agro…; itens sem página aparecem "em breve").
- `src/lib/contexto.ts` — junta mapa, lugares, idioma, moeda e textos de um país.
- `src/pages/dados/` — arquivos JSON gerados no build e baixados pelo navegador sob demanda (ex.: um por produto).
- `src/lib/dados.ts` — lê os arquivos de `dados/` e os textos por idioma.
- `src/config/` — configurações: `site.json`, `paises/<pais>.json` (inclui ajustes do mapa e chamadas), `temas/<tema>-<nivel>.json` (medidas, cortes, legendas), `textos/<idioma>.json` (textos fixos dos moldes).
- `src/estilos/` — cores e estilos globais.
- `design/` — telas aprovadas (só referência; não é publicado).

## Países
- Cada país tem `src/config/paises/<pais>.json`: nome, `dePais` ("do Brasil", "dos Estados Unidos"), `caminho` do endereço ("" para o Brasil, "/estados-unidos"), moeda, níveis, arquivos de dados, ajustes do mapa (chamadas), `subtemas` disponíveis e `cortes` próprios quando a escala muda.
- Páginas de um país usam moldes de página (`src/componentes/PaginaEconomia.astro`, `PaginaAgro.astro`, `PaginaProdutoAgro.astro`); o arquivo em `src/pages/` só escolhe o país. Cada país tem também `slug` (usado em `/dados/<slug>/…`) e `agro.notas` (de onde vêm os números do agro daquele país).
- Scripts de cada país ficam em pastas próprias (ex.: `scripts/eua-pib-estados/`).
- **EUA no ar** (`/estados-unidos/economia/...`, no mapa-múndi da página inicial e no mapa do site), com as 10 abas:
  - Visão geral e Indústria/Serviços/Impostos: BEA, arquivo SAGDP, `scripts/eua-pib-estados/` e `scripts/eua-setores/`.
  - Agro: USDA.
  - Trabalho: BLS + BEA, `scripts/eua-trabalho/`.
  - Preços: CPI do BLS + Regional Price Parities do BEA, `scripts/eua-precos/`.
  - Dinheiro: Fed, Tesouro e Freddie Mac, `scripts/eua-dinheiro/`.
  - Contas públicas: Tesouro dos EUA e BEA, `scripts/eua-contas-publicas/`.
  - Comércio exterior: API do Census, `scripts/eua-comercio/`, nomes em português pelo Comex Stat. A API exige chave: no computador fica em `.env` (fora do GitHub); no robô, no segredo `CENSUS_API_KEY` do GitHub. **Nunca escrever a chave em código ou página.**
- Diferenças de medida ficam no arquivo do país: `abas.<aba>` troca partes da configuração de uma aba (medidas, painéis, textos); `<tema>.sobrescrever` troca textos, apelidos de ícones e o produto padrão dos moldes de produção. Exemplos:
  - EUA medem valor adicionado na indústria;
  - impostos sobre a produção e a importação, mais amplos que os impostos sobre produtos do Brasil;
  - meta do Fed de 2% pelo PCE, sem intervalo;
  - custo de vida no lugar da cesta básica.
- Fontes dos EUA sem chave: BEA (arquivos .zip), BLS API v1 (limite de 25 consultas por dia), Tesouro (fiscaldata), Fed (Data Download Program, em desativação), Freddie Mac. O FRED não respondeu daqui.

## Abas novas de Economia (design)
- Design aprovado das 6 abas novas e da Visão geral refeita: `design/rodada-4-economia/` (vale a v2, com navegação em dois níveis) (o LEIA-ME de lá resume cada tela). Números das telas são exemplos.
- Padrão de cada aba: faixa "<Assunto> hoje" com 3 números nacionais (selo de frequência, fonte, data) + seletor de vistas + mapa/ficha/ranking ou gráfico de série.

## Impostos
- Página `/economia/impostos`: molde `PaginaEconomia` com `aba="impostos"` (`src/config/temas/impostos-estados.json`, que reaproveita a medida da Visão geral pelo id).
- Medida "Impostos sobre produtos (% do PIB)" (**só na aba Impostos**: saiu da Visão geral por decisão do dono, para não repetir; a definição mora em `impostos-estados.json`): cálculo do StatWorld (PIB − valor adicionado) ÷ PIB, tabelas 1 e 4 das Contas Regionais (`scripts/pib-estados/`). Conferido: bate exatamente com a tabela 5938 do Sidra (2021). **Não é arrecadação** — a nota (`aviso` da medida) aparece acima do mapa e na ficha. A ficha mostra composição (valor adicionado × impostos), média do país (`valorPais`) e diferença.
- **Sem faixas "… hoje" nas abas** (decisão do dono: poluíam a página, no topo e embaixo; não recriar nas próximas abas, mesmo que o design mostre). O componente e os dados continuam no projeto caso voltem em outro lugar: faixa "Impostos hoje" (`src/componentes/FaixaHoje.astro`, dados em `dados/impostos/brasil-hoje.json`, `scripts/impostos-hoje/`): impostos no PIB (IBGE), carga tributária (Tesouro, digitada no script a partir do boletim anual, estimativa preliminar) e arrecadação federal do último mês (Receita, arquivo de dados abertos; a data de divulgação de cada mês é digitada no script).
- Visual igual ao design da rodada 4 (`pg_imp`): cabeçalho do mapa com carimbo "selo + fonte · data" à direita; nota com ícone "i" e começo em negrito (`avisoTitulo` + `aviso`); ficha com "% do PIB" (`sufixoFicha`), barra empilhada da composição, média e diferença, frase curta e carimbo; coluna do ranking curta (`rotuloRanking`); ranking com botão "Ver todos" / "Mostrar só os 8 primeiros". A navegação segue o design (versão 2): dois níveis, grupos em cima e abas do grupo embaixo, com "Mais" no computador e rótulos curtos (`nomeCurto` do grupo no catálogo) no celular — `src/componentes/Abas.astro`. Clicar num grupo abre a primeira aba dele que está no ar; grupo sem aba no ar fica apagado.
- Ainda não feito (previsto no mapa): ICMS por estado (Confaz) e arrecadação federal por estado.

## Trabalho e renda
- Página `/economia/trabalho`: molde `PaginaEconomia` com `aba="trabalho-renda"` (`src/config/temas/trabalho-estados.json`, `dados: "trabalho"`).
- Fonte: IBGE, PNAD Contínua (`scripts/trabalho-estados/`). Por estado, trimestral: desemprego (tabela 4099, mapa e ranking) e renda média real habitual (5436, na ficha, via `extras`). Brasil mês a mês desde 2012 (trimestre móvel): desemprego (6381) e renda (6390), na vista "Desemprego e renda no tempo". A data de divulgação vem do próprio IBGE.
- Vista de série: `src/componentes/GraficoSerie.astro` (linhas com cursor ligado entre os gráficos), entra no lugar do mapa (opção com `painel` no `MapaRanking`); ficha e ranking continuam.
- Selo de frequência + fonte · data ao lado dos botões (`carimboNosBotoes`), como no design.
- Empregos com carteira (Novo Caged, Ministério do Trabalho): `scripts/caged-estados/` baixa os **microdados** do mês (FTP oficial, .7z aberto pelo pacote `7zip-bin`) e soma o saldo por estado → `dados/trabalho/brasil-caged.json` (arquivo extra da pasta trabalho: `arquivos.trabalho.extras` no país). Aparece na ficha com o próprio carimbo (mensal). Conferido com a divulgação oficial de set/2026. A data de divulgação de cada mês é digitada no script (`DIVULGACOES`).

## Preços e poder de compra
- Página `/economia/precos`: molde `PaginaEconomia` com `aba="precos"` (`src/config/temas/precos-estados.json`, `dados: "precos"`), script `scripts/precos/`.
- Três vistas:
  - **Inflação em 12 meses** desde 2019 (IBGE, IPCA, tabela 1737), com a faixa do intervalo de tolerância da meta. As metas do CMN estão digitadas no script, conferidas no site do Banco Central.
  - **Cesta básica por capital** (DIEESE pelo Ipeadata, série CESBTOTAL, 27 capitais): mapa e ranking com o nome da capital; na ficha, a parte do salário mínimo bruto e as cestas que ele compra.
  - **Salário mínimo em cestas**: média de cada ano desde 2000, em colunas.
- Painéis "largos" (`largo: true` em `paineis`): a vista ocupa a largura toda, com um cartão de resumo próprio (`resumo.tipo`: "meta" ou "ultimo"), porque não há dado por estado. Gráficos: `GraficoSerie.astro` (linhas ou colunas, faixa opcional, cursor ligado).
- A data da cesta é "atualizada em" (data do Ipeadata), não "divulgada em": o DIEESE não publica a data em formato de dados.

## Comércio exterior
- Página `/economia/comercio-exterior`: molde `PaginaEconomia` com `aba="comercio-exterior"` (`src/config/temas/comercio-estados.json`, `dados: "comercio"`), script `scripts/comercio/` (API oficial do Comex Stat).
- Três vistas:
  - **Exportações por estado** no último ano completo, em US$ (medida com `moeda: "USD"` e `compacto`), mapa, ranking e ficha com a parte do país.
  - **Principais produtos**: lista dos 10, pela classificação internacional CUCI/SITC, posição.
  - **Principais parceiros**: lista dos 10 países.
- O cartão da **balança comercial** do ano em curso (`CartaoBalanca.astro`, config `balanca`) fica no alto da lateral do mapa e ao lado das listas (`ListaBarras.astro`, painéis `tipo: "lista"`).
- Data = "atualizada em" (a API do Comex Stat informa). Conferido com a notícia oficial do MDIC (jan–out 2026).

## Dinheiro e juros
- Página `/economia/dinheiro-e-juros`: molde `PaginaEconomia` com `aba="dinheiro-juros"` (`src/config/temas/dinheiro-brasil.json`), só com **painel de séries** (`painelSeries`, componente `PainelSeries.astro`): não há dado por estado.
- Script `scripts/dinheiro/` (Banco Central, SGS): dólar PTAX (1), Selic meta (432), juros médios do crédito (20714), juros do crédito pessoal (20742), inadimplência (21082), saldo do crédito (20539).
- Cada valor mostra a data a que se refere, e a fonte diz "consultado em".
- **Sem "ao vivo" e sem bolsa:** a série do Ibovespa no SGS parou em 2019 e os dados da B3 exigem licença. Só entram com fonte oficial liberada.

## Contas públicas
- Página `/economia/contas-publicas`: molde `PaginaEconomia` com `aba="contas-publicas"` (`src/config/temas/contas-publicas-brasil.json`), **sem mapa por estado**: só vistas (`Vistas.astro`, botões + painéis), script `scripts/contas-publicas/`.
- Três vistas:
  - **Cada R$ 100** (`CadaCem.astro`, quadradinhos): RTN do Tesouro, governo central, último ano completo. Os grupos são do StatWorld, feitos com as linhas oficiais, e "nova dívida" = gastos − receitas. Cores: tokens `--p-*` do Design System, como no design.
  - **Dívida bruta** (% do PIB, Banco Central, SGS 13762) em gráfico desde 2008.
  - **Gasto por função**, classificação internacional COFOG (Tesouro). Juros (701.7) e transferências a estados e municípios (701.8) aparecem separados.
- Conferido com o Tesouro: resultado primário de 2025 de −R$ 61,7 bi; proteção social em 2024 de R$ 1.518,5 bi. A base COFOG vem em R$ milhões.

## Página inicial
- Visual: design da rodada 3 (`design/rodada-3-lugares/`), com as correções (o arquivo corrigido é `StatWorld Inicio (corrigido).html`).
- Números: mapa-múndi (`scripts/mundo-mapa/`, Natural Earth), faixa "Agora" (`scripts/brasil-agora/`, Banco Central), cartões de tema (`scripts/mundo-temas/`, Banco Mundial). A lista "Fontes usadas" é montada a partir dos próprios arquivos de dados.
- A faixa "Agora" só fica atualizada se o script rodar e o site for publicado de novo; cada número mostra a sua data.
- Cores `--up` e `--down` (subiu/caiu) vieram do design da rodada 3; já estão no Design System.

## Agro
- Lavouras: IBGE, Produção Agrícola Municipal. Leite, ovos, mel, lã, casulos: IBGE, Pesquisa da Pecuária Municipal. Bovinos, suínos, frango: MAPA, Valor Bruto da Produção (valores nominais, ano fechado), porque o IBGE não calcula valor de carne. O site avisa que as fontes usam métodos diferentes. `src/lib/agro.ts` junta tudo; lavouras e pecuária precisam ser do mesmo ano.
- Não inclui silvicultura nem extração vegetal.
- "Não produz" (0 no IBGE, símbolo "-") é diferente de "sem dado" (null).
- "Quanto produz": o degradê de 6 tons usa a cor do produto (do claro ao forte); produto sem cor própria usa o azul padrão. Cada estado produtor mostra o ícone do produto. Há botões com ícone para os 6 maiores produtos com cor própria e um botão "Outros produtos ▾" que abre a lista completa com ícones e busca (quando o produto escolhido não é um dos 6, o botão mostra o nome e o ícone dele).
- Ícones e cores dos produtos vêm do Claude Design (`design/icones/`), extraídos por `scripts/icones-agro/` para `src/config/icones/agro.json` e `src/estilos/cores-produtos.css`. Não invente ícones nem cores de produto: peça ao Claude Design.

## Indústria
- Fonte: IBGE, Pesquisa Industrial Anual – Empresa 2024 (tabela 10457 do Sidra), `scripts/industria-estados/`: valor da transformação industrial e pessoal ocupado por estado e divisão da CNAE (29 setores). Sigilo ("X") = sem dado; a ficha mostra a % do valor do estado sem detalhe, e o setor líder é o maior entre os publicados.
- Usa o mesmo molde do Agro (`PaginaAgro`/`PaginaProdutoAgro` com `temaId="industria"`, `src/lib/agro.ts`, `src/config/temas/industria-estados.json`). `textosMolde` troca "produto" por "setor"; cores com prefixo `s-`.
- Ícones e cores (`--s-*`) do Claude Design: `design/icones-industria/`, extraídos por `scripts/icones-industria/` para `src/config/icones/industria.json` e `src/estilos/cores-setores.css`.

## Serviços
- Fonte: IBGE, Contas Regionais 2024, Conta da produção (`scripts/servicos-estados/`): valor adicionado bruto de 7 atividades de serviços por estado (e crescimento real, guardado para uso futuro). Sem sigilo.
- Mesmo molde do Agro/Indústria (`temaId="servicos"`, `src/config/temas/servicos-estados.json`); filtros "De mercado" e "Públicos"; cores `sv-*`.
- Cada atividade tem uma descrição ("Inclui: …") mostrada na ficha e na página — "Outros serviços" é agrupado pelo próprio IBGE e não é detalhado por estado nessa fonte. Detalhar exigiria outra pesquisa (Pesquisa Anual de Serviços), com outra medida: só num mapa separado.

## Atualização automática
- Rotina do GitHub `.github/workflows/atualizar-dados.yml`: todo dia às 7h (Brasília) roda `scripts/atualizar/rodar.mjs` (scripts frequentes; às segundas, também o Novo Caged), confere o build e, só se algum número mudou, grava em `dados/` e faz push (a Cloudflare publica).
- O `rodar.mjs` desfaz arquivos em que só mudou a data da consulta (`baixadoEm`, `dataConsulta`). Script novo que deva ser automático entra na lista `SCRIPTS` dele.
- Continuam à mão: os anuais (constante `ANO`), as datas de divulgação do Caged e as metas de inflação. Ver `scripts/atualizar/LEIA-ME.md`.

## Comandos
- `npm run dev` — abre o site no computador em http://localhost:4321
- `npm run build` — gera a versão final na pasta `dist/`

## Escolher o ano / ver a evolução
- Abas com série de anos ganham, acima do mapa, um botão ▶ ("ver a evolução": passa ano a ano sozinho), uma faixa de arrastar e o ano escolhido. Hoje: **Visão geral e Impostos do Brasil, 2002–2024; Agro 2017–2025; Indústria 2007–2024** (Serviços, Comércio, Trabalho e EUA ainda não).
- Dados: o país declara `arquivos.economia.anos` (ex.: `brasil-estados-anos`, gerado por `scripts/pib-estados/`). `src/lib/economia-abas.ts` monta as visões de cada ano (mesma lógica da página) e `src/pages/dados/[pais]/economia/[aba]/[ano].json.ts` gera um arquivo por ano, baixado só quando a pessoa pede. O ano mais recente já vem na página.
- Cortes de cor iguais em todos os anos (a mesma cor = o mesmo valor). Dinheiro de anos antigos é **corrigido pela inflação (IPCA)** para reais do ano mais recente; a ficha mostra também "Na época (sem correção)" e "Em <ano mais recente>: posição · valor".
- **Agro e Indústria** (molde `PaginaAgro`): anos antigos em `dados/<tema>/anos/<arquivo>-<ano>.json`, gerados por `scripts/anos-producao/` (roda os scripts de sempre com `ANO` e `SAIDA`). `src/lib/agro.ts`: `anosProducao`, `visoesLiderDoAno`, `visaoProdutoDoAno`; arquivos `/dados/brasil/<tema>/anos/<ano>.json` (líder) e `/dados/brasil/<tema>/<produto>/<ano>.json` (quanto produz). Cores por participação (não sofrem com a inflação); a ficha avisa "Valores em R$ de <ano>, sem correção" e, na indústria, a mudança de série da PIA em 2024 (`industria.notas.avisoAnosAntigos` no país).
- Textos que dizem o ano fora do mapa usam `data-periodo-do-ano` (acompanham a escolha). Medida sem dado num ano (ex.: crescimento em 2002; PIB por pessoa em 2023, sem população do IBGE) aparece como "sem dado", nunca zero.

## Fios (trilhas de criações e fatos)
- Seção `/fios`: criações e fatos ligados ("uma coisa puxa a outra"). Cada trilha é um arquivo em `dados/fios/<trilha>.json` (nós com ano, faixa, lugar, pessoas, resumo e **fontes**; ligações `de → para` com um `tipo` que vira frase, ex.: "deu lugar a"). Página genérica `src/pages/fios/[trilha].astro` + componente `src/componentes/Fios.astro`; lista em `src/pages/fios/index.astro`. Entrar por qualquer item: `/fios/<trilha>#<id>`.
- Computador: mapa com anos em colunas (só anos com item) e faixas de assunto, + cartão ao lado ("De onde veio", cartão, "O que veio depois", "Seu caminho"). Celular: trilha de cartões, com botão "Mapa".
- **Regra de conteúdo:** cada data e fato conferido na fonte (frase do artigo com o ano) antes de entrar; anotar `conferidoEm`. Ligação só quando a relação é verdadeira (ex.: o 1º iPhone não tinha 3G). Piloto: "Do telégrafo ao smartphone", 36 itens, 1837–2022.

## Visitas e painel do administrador
- `servidor/index.js` roda na Cloudflare na frente do site (só `/api/*` e `/admin*`; ver `run_worker_first` no `wrangler.jsonc`). LEIA-ME: `servidor/LEIA-ME.md`.
- Contador de visitas próprio, **anônimo e sem cookies** (script no fim de `src/layouts/Base.astro`): página, país, estado e cidade aproximados, aparelho, origem (só o nome do site, ou a marca `utm_source` do link, que identifica IAs como o ChatGPT) e tempo à vista. Não guarda IP; "pessoas diferentes" por código embaralhado com sal diário apagado no dia seguinte. Banco D1 `statworld-visitas` (binding `VISITAS`). Descrito na política de privacidade: se mudar o que é guardado, mude a política.
- `/admin` (`src/pages/admin/index.astro`): só com usuário `admin` e a senha do segredo `SENHA_ADMIN` (criada pelo dono na Cloudflare; nunca no código). Mostra visitas, dinheiro (`src/config/monetizacao.json`: fontes de receita e requisitos para anúncios; nenhum valor de receita escrito à mão), o **painel de progresso** (`src/config/progresso.json`, atualizar no fim de toda sessão e dizer "de X% para Y%") e o que o site tem e terá. Fora do mapa do site e do robots.
