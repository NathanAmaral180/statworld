# Ideias: infraestrutura do Brasil (mapas "fora da curva")

Pedido do dono (26 nov 2026): mostrar a **infraestrutura física** do país em mapas próprios, não só números por estado. O traçado das BRs, os trilhos, os portos, os aeroportos, os cabos de internet. Entra nos temas **Transporte e infraestrutura** e **Tecnologia e conectividade** do catálogo (`src/config/catalogo.json`) e, em parte, em **Energia**.

Como todo tema novo, passa antes pelo Claude Design (pedido em `design/PEDIDO-tema-infraestrutura.md`).

**Diferença do resto do site:** até agora os mapas pintam áreas (estado ou município). Aqui o mapa desenha **linhas** (estradas, trilhos, cabos) e **pontos** (portos, aeroportos, estações). É um tipo de mapa novo, com zoom do país inteiro até uma cidade.

---

## 1. Rodovias
- **Malha federal (BRs):** traçado de cada BR, com número, extensão e situação: pavimentada, em obras, planejada, duplicada ou de pista simples.
- **Rodovias estaduais (SPs, MGs, PRs…):** o mesmo, por estado. Os dados vêm de cada estado ou do sistema nacional do DNIT, que inclui as estaduais coincidentes.
- **Concessões:** trechos administrados por concessionárias, com pedágio e nome da empresa.
- **Ficha de cada BR:** por onde passa (estados e cidades), quilômetros, trechos duplicados e de onde a onde vai. Exemplo: "BR-116, de Fortaleza a Jaguarão, 4.500 km" (a conferir).
- **Ideias extras:**
  - "a BR que passa na sua cidade";
  - a maior e a mais movimentada;
  - acidentes por trecho (PRF, dados abertos);
  - contagem de tráfego (DNIT).

## 2. Ferrovias (a parte que o dono mais pediu)
- **Mapa de trens do Brasil inteiro:** todas as ferrovias com cada concessão numa cor. Exemplos: Rumo Malha Norte/Sul/Paulista/Oeste, MRS, VLI/FCA, EFC (Carajás), EFVM (Vitória-Minas), Ferroeste, Transnordestina, FIOL, FICO e Ferrovia Norte-Sul.
- **Tipo de transporte de cada trecho**, com legenda:
  - só carga;
  - carga e passageiros;
  - só passageiros;
  - desativado ou abandonado;
  - em obras;
  - planejado.
- **Projetos:** Ferrogrão (Sinop–Miritituba), FICO, FIOL, Transnordestina e o trem Rio–São Paulo. Cada um com a situação (estudo, licitação, obra), a fonte e a data.
- **Aproximar numa região:** exemplo, **Porto Alegre e a região metropolitana**:
  - Trensurb (passageiros);
  - trechos de carga da Rumo;
  - ramais desativados.
  - Mesma ideia para a Grande São Paulo (CPTM, metrô, MRS) e o Rio (SuperVia).
- **Trens de passageiros que existem hoje:** Vitória-Minas, Carajás, trens turísticos e trens urbanos.
- **Ficha da ferrovia:** concessionária, quilômetros, bitola, o que leva (minério, grãos, contêiner), toneladas por ano (ANTT) e passageiros por ano.
- **Linha do tempo:** a malha de 1950 × a de hoje, para mostrar quanto foi desativado. Pode virar uma trilha dos **Fios**.

## 3. Portos e hidrovias
- Portos públicos e terminais privados, com o tamanho pela carga movimentada (ANTAQ, Estatístico Aquaviário).
- O que cada porto movimenta: soja, minério, contêiner, petróleo.
- Hidrovias navegáveis: Tietê-Paraná, Madeira, Tapajós, Amazonas. Com a soja como exemplo de "caminho da safra": da fazenda, por estrada, trem ou rio, até o porto.

## 4. Aeroportos
- Todos os aeródromos públicos, com destaque para os que têm voo comercial (ANAC).
- Tamanho pelo número de passageiros por ano. Ranking dos mais movimentados.
- Rotas: "para onde se voa a partir da sua cidade" (ANAC, dados de voos).
- Concessões, com o aeroporto e a empresa que o administra.

## 5. Internet e telecomunicações (Tecnologia e conectividade)
- **Cabos submarinos** que chegam ao Brasil (Fortaleza, Rio, Santos, Praia Grande…), com o traçado até os outros continentes.
- **Pontos de troca de tráfego (IX.br):** onde as redes se encontram em cada cidade.
- **Antenas de celular (ERBs) e cobertura 4G/5G** por município (Anatel).
- **Banda larga fixa:** acessos por município e velocidade contratada (Anatel).
- **Data centers** (se houver fonte aberta).

## 6. Energia (tema Energia)
- Usinas por fonte (hidrelétrica, eólica, solar, térmica, nuclear), com o tamanho pela potência (ANEEL, SIGA).
- Linhas de transmissão (ONS e EPE).
- Gasodutos e refinarias (ANP e EPE).

## 7. Outras ideias "fora da curva"
- **"O que existe perto de você":** a partir da cidade, a BR mais próxima, a estação de trem, o aeroporto, o porto e a usina.
- **Comparar o Brasil com outros países:** quilômetros de ferrovia por área, ou estrada pavimentada por habitante (Banco Mundial e CIA Factbook, a conferir).
- **Barragens** (ANA, SNISB) e **pontes** importantes.
- **Faróis da costa** (Marinha) e **postos de fronteira**.

---

## Fontes candidatas (todas "a verificar" antes de usar)
| Assunto | Fonte | Formato provável |
|---|---|---|
| Rodovias federais e estaduais | DNIT, Sistema Nacional de Viação (SNV) | shapefile, por versão |
| Rodovias (base cartográfica) | IBGE, Base Cartográfica Contínua (BC250) | shapefile |
| Ferrovias | ANTT (malha ferroviária, declarações de rede, produção) | shapefile / planilhas |
| Ferrovias, portos, hidrovias | Ministério dos Transportes / EPL / ONTL (Observatório Nacional de Transporte e Logística) | geoserviços |
| Portos | ANTAQ, Estatístico Aquaviário | dados abertos |
| Aeroportos e voos | ANAC (aeródromos públicos, dados estatísticos, VRA) | dados abertos |
| Acidentes nas BRs | PRF, dados abertos | CSV |
| Trens urbanos | Trensurb, CPTM, SuperVia (dados abertos de cada um) | a ver |
| Cabos submarinos | TeleGeography (submarinecablemap.com) | **licença a conferir: o site tem anúncios e a licença pode proibir uso comercial** |
| Pontos de troca de tráfego | IX.br (NIC.br) | página/lista |
| Antenas e banda larga | Anatel (dados abertos) | CSV |
| Usinas e transmissão | ANEEL (SIGA), ONS, EPE | dados abertos |

**Licença:** cada fonte precisa permitir uso num site com anúncios. Onde a licença proibir uso comercial (ex.: talvez os cabos submarinos), procurar outra fonte ou pedir autorização.
