# StatWorld — regras permanentes

StatWorld: "Os números do mundo, explicados." Site de dados globais feito com Astro.
Primeiro tema: Economia. Primeiro país: Brasil.

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
- Textos do site, temas e país padrão ficam em `src/config/site.json`.
- Para outro tema: troca-se só a medida, os cortes e a legenda. Mapa, ficha, ranking e cores ficam iguais.

## Visual (guia: `design/LEIA-ME-design-1abc.md`)
- **Tema claro e escuro**, usando apenas as cores do guia, definidas como variáveis em `src/estilos/global.css`. Não use cores soltas fora dessas variáveis.
- Fonte do sistema, números tabulares (`font-variant-numeric: tabular-nums`).
- Layout de referência aprovado: **1c Mapa e ranking** (`design/1c-mapa-ranking.png` e `design/rodada-2-agro/`).
- Estados pequenos com linha de chamada (RN, PB, PE, AL, SE, DF, ES, RJ); passar o mouse = prévia, clicar = fixa.

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
- EUA: páginas de teste em `/estados-unidos/economia` (BEA) e `/estados-unidos/economia/agro` (USDA, cash receipts), fora do menu e com "noindex".

## Agro
- Lavouras: IBGE, Produção Agrícola Municipal. Leite, ovos, mel, lã, casulos: IBGE, Pesquisa da Pecuária Municipal. Bovinos, suínos, frango: MAPA, Valor Bruto da Produção (valores nominais, ano fechado), porque o IBGE não calcula valor de carne. O site avisa que as fontes usam métodos diferentes. `src/lib/agro.ts` junta tudo; lavouras e pecuária precisam ser do mesmo ano.
- Não inclui silvicultura nem extração vegetal.
- "Não produz" (0 no IBGE, símbolo "-") é diferente de "sem dado" (null).
- Ícones e cores dos produtos vêm do Claude Design (`design/icones/`), extraídos por `scripts/icones-agro/` para `src/config/icones/agro.json` e `src/estilos/cores-produtos.css`. Não invente ícones nem cores de produto: peça ao Claude Design.

## Comandos
- `npm run dev` — abre o site no computador em http://localhost:4321
- `npm run build` — gera a versão final na pasta `dist/`
