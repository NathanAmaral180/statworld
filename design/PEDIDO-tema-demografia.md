# Pedido ao Claude Design: tema Demografia (Brasil, estados e municípios)

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole.

---

O StatWorld ("Os números do mundo, explicados.") já tem o tema **Economia** no ar: Brasil por estado (rodada 4, navegação em dois níveis) e a página de São Paulo por município (rodada 5, mapa dos municípios em cinzas com o destaque na cor da bandeira do estado). Agora vem o segundo tema: **Demografia**, sobre quem somos, quantos somos e como estamos mudando.

Use o Design System **StatWorld** (tokens, componentes, ícones, tema claro e escuro). Mantenha o que já existe (cabeçalho, abas em dois níveis, ficha, selos de frequência, carimbo "fonte · data", "sem dado" com hachura).

**Mas não se prenda ao molde "mapa + ranking + ficha".** Na Economia você misturou mapa, séries no tempo, listas e "cada R$ 100", e ficou melhor. Demografia pede formas próprias. Use a criatividade: proponha o que mostra melhor cada assunto, mesmo que seja algo que o site ainda não tem. Depois o dono escolhe o que entra.

## O que existe de dado (fontes oficiais; números ainda a conferir)
Fonte principal: **IBGE** (Censo 2022, estimativas anuais de população, projeções de população, Estatísticas do Registro Civil, Tábuas de Mortalidade). A maior parte existe **por município**.
- **Quantos somos:** população, densidade, crescimento entre os Censos (2010 → 2022) e nas estimativas mais recentes, maiores e menores cidades, cidades que cresceram e que encolheram.
- **Idade:** pirâmide etária (por sexo e faixa de idade), idade mediana, índice de envelhecimento (idosos para cada 100 crianças), comparação da pirâmide de um lugar com a do país, como a pirâmide mudou de 1980 a 2022 e a projeção até 2070.
- **Nascer e morrer:** nascimentos, mortes, fecundidade (filhos por mulher), esperança de vida ao nascer (por estado).
- **Quem somos:** cor ou raça, sexo, povos indígenas e quilombolas (o Censo 2022 contou os dois pela primeira vez com esse detalhe).
- **Onde e como moramos:** domicílios, pessoas por domicílio, urbano × rural.
- **Migração:** quem nasceu em outro estado, de onde veio e para onde foi.

## Ideias (pode mudar, juntar ou trocar tudo)
- Pirâmide etária interativa, com passagem do tempo (▶ ver a evolução, como já existe na Economia).
- "Cada 100 pessoas" (como o "cada R$ 100" das Contas públicas), mostrando idade, cor ou raça, urbano × rural.
- Mapa de quem cresceu × quem encolheu, com cores divergentes.
- Fluxos de migração entre estados.
- Comparar dois lugares lado a lado (ex.: minha cidade × o Brasil).
- Um número "ao vivo" de população só com o selo **"estimativa"** (projeção do IBGE). Nunca apresentado como medição.

## Níveis
- **Brasil por estado** (como `/economia`) e **estado por município** (como `/sp/economia`, no mesmo molde da rodada 5: cinzas + cor da bandeira do estado, busca, filtro por região, ranking longo).
- Proponha as **abas** do tema, em grupos, como na Economia, e diga o que cada aba mostra em cada nível. Quando um dado não existe num nível, use as situações da rodada 5: "só o número do estado", "sem dado neste nível" ou "em breve".

## Telas que preciso (claro e escuro, desktop 1440 e celular 375)
1. Visão geral de Demografia do Brasil.
2. Uma tela de cada aba que você propuser, com a melhor forma para aquele dado.
3. Demografia de São Paulo por município (Visão geral) e uma aba com uma forma que não seja mapa.
4. A ficha de um município com os números de Demografia.

## Restrições
- Nada exclusivo do Brasil nem de São Paulo: nomes, níveis, cores e textos vêm de configuração.
- Nada de números inventados nas telas: textos de exemplo marcados ("00,0%") com o selo "exemplo".
- Todo número com fonte, data e selo de frequência. "Sem dado" com hachura, nunca zero.
- Funcionar com teclado e leitor de tela. No celular, textos curtos.
- Nada de faixas "… hoje" no topo das abas (o dono tirou da Economia porque poluíam).
- Temas sensíveis (cor ou raça, povos indígenas): linguagem neutra e respeitosa, os termos oficiais do IBGE e nenhuma interpretação.

---

Quando receber, coloque os arquivos numa pasta nova `design/rodada-6-demografia/` e avise o Claude.
