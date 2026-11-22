# Pedido ao Claude Design: seletor de lugar (Mundo / país)

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole.

---

O StatWorld ("Os números do mundo, explicados.") vai ter vários lugares. Hoje existem o Brasil e um protótipo dos Estados Unidos, e no futuro também uma visão do **Mundo**, com um mapa-múndi em que cada país é um lugar do mapa e do ranking.

Use o Design System **StatWorld** (tokens, componentes e ícones) e não crie estilo novo: as telas precisam parecer parte do mesmo site. Preciso que você desenhe **como a pessoa escolhe o lugar**, mantendo o sistema visual atual (cores, tipografia, temas claro e escuro, cabeçalho com StatWorld + Economia / Saúde / Política / Demografia + botão de tema).

**Proposta inicial (pode melhorar):**
1. **Seletor de lugar no cabeçalho**, à esquerda dos temas ou logo depois do logo, mostrando o lugar atual com bandeira ou sigla: "Brasil ▾".
2. Ao abrir, aparece uma lista com:
   - **Mundo** em primeiro lugar, separado do resto;
   - os **países disponíveis**, com busca por nome (a lista vai crescer);
   - países ainda sem dados aparecem como "em breve".
3. A **trilha** (breadcrumb) também mostra o lugar e deixa trocar: "Economia / Brasil ▾ / Agro".
4. Ao trocar de lugar, a pessoa continua no **mesmo tema e na mesma aba** (ex.: do Agro do Brasil para o Agro dos EUA). Se aquele lugar não tiver a aba, ela vai para a Visão geral e vê um aviso curto.
5. A **página inicial** ganha uma forma de começar pelo lugar (ex.: "Escolha um lugar: Mundo · Brasil · Estados Unidos…").

**Página inicial completa (nova)**
Hoje a página inicial tem só o slogan. Preciso de uma página de entrada de verdade. Sugestão de blocos (pode reorganizar):
- **Abertura**: o slogan "Os números do mundo, explicados." e a escolha de lugar (Mundo, Brasil, Estados Unidos…).
- **Números de hoje**: 3 a 4 números recentes do lugar escolhido (ex.: PIB do trimestre, inflação, juros), cada um com fonte, data e frequência (mensal, trimestral), no estilo da faixa "Brasil hoje" da tela 1c revisada.
- **Mapas em destaque**: cartões que levam aos mapas existentes (Economia · Visão geral, Agro, páginas de produto), com uma miniatura do mapa.
- **Recém-atualizado**: lista automática dos dados que mudaram por último (ex.: "PIB dos estados · IBGE · 13 nov 2026").
- **Reportagens**: espaço para histórias como "O agro no Brasil" (tela 4), com título, resumo e data.
- **Temas**: Economia, Saúde, Política e Demografia, com os que ainda não existem marcados como "em breve".
- **Como trabalhamos**: um bloco curto explicando que todo número tem fonte e data e que "sem dado" nunca vira zero.

**Telas que preciso (claro e escuro, desktop 1440 e celular 375):**
- cabeçalho com o seletor fechado;
- seletor aberto, com Mundo, a lista de países, a busca e os itens "em breve";
- trilha com a troca de lugar;
- página inicial completa (todos os blocos acima), com a escolha de lugar;
- como fica o **Mundo · Economia**: mapa-múndi com os países pintados e o ranking ao lado (no mesmo estilo da tela "1c Mapa e ranking");
- aviso de "esta aba ainda não existe para este lugar".

**Restrições:**
- Ícone e nome de cada país vêm de configuração; não desenhe nada específico de um país só.
- Precisa funcionar com teclado e leitor de tela.
- Nada de números inventados nas telas: use textos de exemplo claramente marcados (ex.: "00,0%").

---

Quando receber, coloque os arquivos numa pasta nova `design/rodada-3-lugares/` e avise o Claude.
