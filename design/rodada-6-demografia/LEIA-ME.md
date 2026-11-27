# Rodada 6: Demografia (Claude Design)

Arquivo original: `StatWorld Demografia telas (offline).html` (abrir no navegador). São 12 telas, claro e escuro, desktop 1440 e celular 375.
`codigo/` tem o código descompactado:
- `molde-demografia.js`: o comportamento;
- `config-demografia.js`: abas, situações por nível e as tabelas do IBGE de cada número;
- `telas/`: o HTML de cada tela.

**Os números das telas foram consultados pelo design em 26 nov 2026 e NÃO estão conferidos.** No site, cada número vem dos nossos scripts e de `dados/`.

## Abas (mesma barra em dois níveis da Economia)
| Grupo | Aba | Brasil, por estado | Estado, por município |
|---|---|---|---|
| — | Visão geral | Mapa com 4 medidas (população, densidade, crescimento, idade mediana), ficha com a **população estimada "segundo a segundo"** (selo "Estimativa", nunca contagem), ranking; embaixo "cada 100 pessoas" (idade, cor ou raça, área) ao lado da pirâmide | Mapa dos municípios em cinzas + vermelho da bandeira, busca, região, ranking longo, ficha |
| Quantos somos | Crescimento | Mapa **divergente** (encolheu × cresceu, centro no zero), ficha 2010 → 2022, barras divergentes dos 27 | **Dispersão sem mapa:** cada ponto é um município (tamanho × crescimento ao ano), contagem de quem cresceu/encolheu, extremos, busca e região |
| Idade e vida | Pirâmide etária | Pirâmide por sexo e faixa de 5 anos, **1980 a 2060 com ▶** (projeção tracejada e mais clara), contorno do Brasil para comparar; idade mediana, índice de envelhecimento, mediana no tempo | Pirâmide 2022 do município × estado; a evolução fica como "só o número do estado" |
| Idade e vida | Nascimentos e mortes | Série 2015–2024, nascimentos para cada morte por estado, o ano em que as mortes passam os nascimentos (projeção), filhos por mulher | Nascimentos e mortes de 2024 por município; projeção = só o número do estado |
| Idade e vida | Esperança de vida | **Halteres** homens × mulheres por estado, linha do Brasil, seletor de ano 2000–2060 | Só o número do estado (o IBGE só calcula por estado) |
| Quem somos | Cor ou raça | Cada 100 pessoas do lugar + barras 100% dos 27, ordenáveis por categoria; termos e ordem do IBGE; cores só distinguem categorias | Mesma forma |
| Quem somos | Indígenas e quilombolas | **Círculos proporcionais** sobre o mapa em cinza, ficha (parte da população, quantos moram em terras indígenas ou territórios quilombolas), ranking | Mesma forma; sem pessoas recenseadas = sem dado (hachura) |
| Onde moramos | Domicílios | Cada 100 pessoas urbana × rural, domicílios ocupados, ranking de pessoas por domicílio ou % urbana | Mesma forma |
| Onde moramos | Migração | **Arcos** dos 8 maiores fluxos entre estados (nascimento × onde mora), nas duas direções; ficha com nascidos fora, os que saíram, nascidos em outro país | Em breve |
| — | Ficha do município (tela 12) | — | Números do município × estado × país: idade, crescimento, cor ou raça, domicílios, nascimentos e mortes, indígenas e quilombolas; esperança de vida = só o estado; migração = em breve |

## Dados: o que já temos e o que falta
Já temos em `scripts/populacao/` → `dados/demografia/`:
- população (4709);
- área e densidade (4714);
- estimativas 2025 e 2026 (6579);
- pirâmide 2022 e as medidas de idade (9514).

Faltam (tabelas que o design indicou, a conferir):

| Assunto | Tabela | Níveis |
|---|---|---|
| Cor ou raça | 9605 (Censo 2010 e 2022) | Brasil, estado, município |
| Indígenas | 9718 (em terras indígenas × fora) | Brasil, estado, município |
| Quilombolas | 9578 (em territórios × fora) | Brasil, estado, município |
| Domicílios e moradores por domicílio | 4712 | Brasil, estado, município |
| Urbana × rural | 9923 | Brasil, estado, município |
| Migração (lugar de nascimento) | 631 | Brasil e estado |
| Nascimentos | 2609 (Registro Civil, até 2024) | até município |
| Mortes | 2654 (Registro Civil, até 2024) | até município |
| Pirâmides de 1980 a 2010 | 200 (Censos, amostra) | Brasil e estado |
| Projeção da população por idade | 7358 (revisão 2018) | Brasil e estado |
| Esperança de vida | 7362 (revisão 2018) | Brasil e estado |

**Atenção:** o IBGE publicou uma revisão nova das Projeções da População em 2024. Antes de usar as tabelas 7358 e 7362 (revisão 2018), conferir se já há tabelas da revisão 2024.

## Regras que valem (do projeto)
- **População "ao vivo":** só com o selo "Estimativa", e o cálculo explicado (estimativa + nascimentos e mortes).
- **Cor ou raça, indígenas e quilombolas:** termos oficiais do IBGE, na ordem do IBGE, linguagem neutra e nenhuma interpretação.
- **Mapa dos municípios:** cinzas, com o destaque na cor da bandeira do estado (decisão do dono).
