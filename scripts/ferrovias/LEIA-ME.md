# Script: ferrovias do Brasil (tema Transporte e infraestrutura)

## O que faz
Baixa do Ministério dos Transportes o mapa oficial das ferrovias ("Base Georreferenciada - Ferrovias", versão de abril de 2024) e transforma num arquivo que o site consegue desenhar.

Cada trecho traz:
- **situação**: em operação, desativada, em obra, planejada ou em estudo;
- **bitola**: larga, métrica, mista ou standard;
- **número da ferrovia** no Sistema Nacional de Viação (EF-xxx);
- **concessão ou projeto**: RMS, MRS, FCA, FICO, Ferrogrão, Bioceânica…;
- **estado, município e extensão** em km.

O traçado é **simplificado**: o original tem 860 mil pontos, e o site usa cerca de 30 mil, com precisão de uns 200 m. Isso é suficiente para o mapa do país. Para aproximar muito (ex.: Porto Alegre), dá para gerar uma versão mais detalhada só daquela região, diminuindo `TOLERANCIA`.

## O que a base NÃO tem (precisa de outra fonte)
- **Se o trecho leva carga, passageiros ou os dois.** Ideias de fonte: ANTT (declarações de rede, produção ferroviária) e as operadoras de trens de passageiros (Trensurb, CPTM, SuperVia, EFVM, EFC).
- **Concessionária completa:** o campo vem preenchido só em parte dos trechos. Dá para completar pelo número da ferrovia (EF-xxx) e pelos mapas da ANTT.

## De onde vem
- Página: https://www.gov.br/transportes/pt-br/assuntos/dados-de-transportes/bit/bit-mapas
- Arquivo: `BaseFerro.zip` (shapefile, SIRGAS 2000)

O gov.br recusa pedidos que não dizem qual é o navegador, por isso o script se identifica como um navegador comum.

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/ferrovias/baixar.mjs
```

## O que ele cria
`dados/infraestrutura/brasil-ferrovias.json` (GeoJSON), com o resumo de km por situação e por concessão para conferência.

## Números para conferir (26 nov 2026)
O script soma 28.005 km em operação, 4.272 km desativados, 2.493 km em obra, 11.729 km planejados e 5.512 km em estudo. **Ainda falta comparar com o número oficial da ANTT** (cerca de 30 mil km de malha concedida, a conferir).

## Se der erro
- "O arquivo não foi baixado": o Ministério mudou o endereço. Abra a página acima, copie o link de "Base Georreferenciada - Ferrovias" e troque `URL_ZIP` (com `/@@download/file` no fim).
- "A tabela das ferrovias mudou": o Ministério mudou as colunas. Peça ajuda ao Claude.
