Antes de enviar: escolha o Design System "StatWorld" no Claude Design e anexe:
1. o vídeo de referência (a rede neural azul);
2. a v1 ("Universo dos Fios - Direcao de Arte") e a v2 ("Pequeno Universo v2");
3. prints do que está no ar hoje: o universo grande de longe e com um item focado (computador e celular), e o pequeno universo do Telefone. Link: https://statworld.nathanjulho180.workers.dev/fios/universo

---

Olá! Esta é a v3 da direção de arte do "Universo dos Fios" do StatWorld, agora focada no **universo grande**: a cena 3D que é a porta de entrada. Use o Design System StatWorld (está selecionado). Anexei o vídeo de referência, as suas v1 e v2 e prints do site no ar.

**Onde estamos:**
- O **pequeno universo** (v2) já foi implementado e ficou bom: foto real no centro, linha do tempo, corrente nos fios, cartão em papel, Archivo + Source Serif. Ele é a referência de identidade e **não precisa ser redesenhado**.
- O **universo grande** no ar hoje é uma versão provisória (veja os prints). Ainda está longe do vídeo: parece um diagrama de bolas ligadas por feixes retos, não uma teia viva.
- A cena da v1 tinha boas ideias (fios finíssimos que somam luz, pulsos, névoa, anel para pessoa, rastro âmbar do caminho), mas a interface tinha cara de IA: mono fina em tudo, traço fino em tudo, tudo simples demais.

**O que quero na v3:** redesenhe o universo grande do zero, com liberdade, para ficar à altura do pequeno universo e do vídeo. As regras:
- **Nada de visual genérico de IA:** nada de mono fina, linha fina em tudo, cinza sobre cinza, cards iguais ou placeholders tracejados.
- **Mesma identidade da v2 para que os dois pareçam um produto só:**
  - Archivo forte e larga para títulos e nomes;
  - papel e tinta do StatWorld na interface;
  - âmbar como único acento quente.
- **A cena tem que impressionar de longe,** como no vídeo: um emaranhado denso e brilhante que, de longe, "não faz sentido". Ao aproximar aparecem as regiões, depois os nomes. Mostre como a densidade, a luz e a profundidade criam essa sensação. Hoje são 809 itens e 6.001 fios.
- **Fotos reais também no universo grande:** pense em quando e como os pontos viram ícones com foto (já temos foto do Wikimedia Commons para 629 dos 809 itens), por exemplo ao chegar perto ou ao focar.
- **Ponte clara para o pequeno universo:**
  - hoje, 1º toque foca o item e 2º toque mergulha nele (ou o botão "Entrar no pequeno universo");
  - mostre esse convite de forma óbvia e bonita;
  - desenhe a volta, quando o "Seu caminho" vira rastro no universo grande.
- **As 13 galáxias** precisam de nome legível e bonito, sem poluir.
- **Celular primeiro** (360 × 760), depois computador (1120 × 700).
- Números e datas nos desenhos são só exemplos.

**Entregue:**
- os quadros:
  1. de longe;
  2. aproximando de uma galáxia;
  3. item focado com o convite para mergulhar;
  4. seguindo um caminho;
  5. busca;
  6. a transição de mergulho e a volta;
- cada quadro no celular e no computador;
- notas de implementação para three.js, como na v1. Hoje usamos 3d-force-graph + three.js com UnrealBloomPass; pode propor trocar o que for preciso.
