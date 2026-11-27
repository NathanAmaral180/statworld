# Pedido ao Claude Design: Infraestrutura do Brasil (estradas, trilhos, portos, aeroportos, cabos)

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole.

---

O StatWorld ("Os números do mundo, explicados.") tem hoje mapas que **pintam áreas** (estados e municípios). Agora quero um tipo novo: mapas da **infraestrutura física** do Brasil, que desenham **linhas** (estradas, trilhos, cabos submarinos, linhas de transmissão) e **pontos** (portos, aeroportos, estações, usinas, pontos de troca de internet), com zoom do país inteiro até uma cidade. Entra nos temas **Transporte e infraestrutura** e **Tecnologia e conectividade**.

Use o Design System **StatWorld** (tokens, componentes, ícones, tema claro e escuro) e mantenha o que já existe (cabeçalho, abas em dois níveis, ficha, selos, carimbo "fonte · data"). **Use a criatividade:** proponha a melhor forma para cada assunto, mesmo que o site ainda não tenha nada parecido. O dono escolhe depois o que entra.

## O que o dono quer ver
1. **Rodovias:** a malha das BRs com o traçado e o número de cada uma; as estradas estaduais; a situação de cada trecho (pavimentada, em obras, planejada, duplicada); concessões e pedágios. Ficha de cada BR (por onde passa, quilômetros) e "a BR que passa na sua cidade".
2. **Ferrovias (prioridade):**
   - o **mapa de trens do Brasil inteiro**, com cada concessão numa cor;
   - a legenda pelo **tipo de transporte**: só carga, carga e passageiros, só passageiros, desativada, em obras, planejada;
   - os projetos: Ferrogrão, FICO, FIOL, Transnordestina;
   - e **aproximar numa região**: exemplo, Porto Alegre e a região metropolitana (Trensurb, trechos de carga, ramais desativados).
   - Ficha da ferrovia: concessionária, quilômetros, o que transporta, toneladas e passageiros por ano.
   - Se couber: a malha de antigamente × a de hoje.
3. **Portos e hidrovias:** portos com o tamanho pela carga movimentada e o que cada um movimenta; os rios navegáveis.
4. **Aeroportos:** todos os públicos, com destaque para os de voo comercial, tamanho por passageiros, rotas a partir de uma cidade.
5. **Internet:** cabos submarinos que chegam ao Brasil (traçado até outros continentes), pontos de troca de tráfego (IX.br), antenas 4G/5G e banda larga por município.
6. **Energia:** usinas por fonte (tamanho pela potência) e linhas de transmissão.
7. **"O que existe perto de você":** escolhida uma cidade, a BR, a estação, o aeroporto, o porto e a usina mais próximos.

A lista completa de ideias está no projeto (`docs/IDEIAS-infraestrutura.md`).

## Problemas de desenho que preciso resolver
- **Várias camadas no mesmo mapa** (estradas + trilhos + portos + aeroportos): como ligar e desligar cada uma sem confundir, e como ficam juntas.
- **Linhas sobrepostas** (BR e ferrovia lado a lado; várias concessões no mesmo trilho).
- **Zoom do país até uma cidade**, com os nomes aparecendo conforme aproxima (o mapa dos municípios da rodada 5 já faz zoom: dá para seguir o mesmo jeito).
- **Muitas cores de concessão** sem virar um arco-íris confuso, legível no claro e no escuro.
- Escolher uma linha ou um ponto abre a ficha (como a ficha dos estados e municípios), e a ficha tem fonte e data.
- No celular: tocar numa linha fina precisa ser fácil (área de toque maior, ou lista do que está naquele ponto, como na rodada 5).

## Telas que preciso (claro e escuro, desktop 1440 e celular 375)
1. Ferrovias do Brasil inteiro, por tipo de transporte e por concessão.
2. Ferrovias aproximadas em Porto Alegre e na região metropolitana.
3. Rodovias federais (BRs), com a ficha de uma BR aberta.
4. Rodovias estaduais de um estado (exemplo: São Paulo).
5. Portos e aeroportos (juntos ou separados, como ficar melhor).
6. Cabos submarinos e pontos de troca de internet.
7. "O que existe perto de você", para uma cidade.
8. Como fica a escolha de camadas no celular.

## Restrições
- Nada exclusivo do Brasil: nomes, camadas, cores e textos vêm de configuração (no futuro, outros países).
- Nada de dados inventados: traçados e números de exemplo marcados com o selo "exemplo". Cores de concessão de exemplo, neutras.
- Todo dado com fonte, data e selo de frequência. "Sem dado" com hachura, nunca zero.
- Anúncio nunca junto do mapa, da ficha ou dos gráficos.
- Funcionar com teclado e leitor de tela (ex.: lista das linhas e pontos visíveis, além do desenho).

---

Quando receber, coloque os arquivos numa pasta nova `design/rodada-8-infraestrutura/` e avise o Claude.
