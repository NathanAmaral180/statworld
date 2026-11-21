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
- `src/componentes/mapa-ranking/` — molde mapa + ranking + ficha (`logica.ts` tem as regras, usadas no servidor e no navegador).
- `src/lib/dados.ts` — lê os arquivos de `dados/` e os textos por idioma.
- `src/config/` — configurações: `site.json`, `paises/<pais>.json` (inclui ajustes do mapa e chamadas), `temas/<tema>-<nivel>.json` (medidas, cortes, legendas), `textos/<idioma>.json` (textos fixos dos moldes).
- `src/estilos/` — cores e estilos globais.
- `design/` — telas aprovadas (só referência; não é publicado).

## Comandos
- `npm run dev` — abre o site no computador em http://localhost:4321
- `npm run build` — gera a versão final na pasta `dist/`
