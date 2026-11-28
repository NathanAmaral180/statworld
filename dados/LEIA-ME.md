# Pasta dados/

Aqui ficam **todos os números do site**. Nenhuma página tem número escrito dentro dela: as páginas leem daqui.

## Regras
- Todo número vem com **fonte** (quem publicou) e **data** (quando foi publicado / a que período se refere).
- Quando não existe o número, use `null` e o site mostra **"sem dado"**. Nunca coloque `0` no lugar de "sem dado".
- Os arquivos são gerados pelos scripts da pasta `scripts/` sempre que possível, e não digitados à mão.

## Formato combinado (exemplo de estrutura, sem números reais)
```json
{
  "indicador": "nome-do-indicador",
  "unidade": "%",
  "fonte": { "nome": "Nome da instituição", "publicacao": "Nome da publicação", "url": "https://...", "dataDivulgacao": "AAAA-MM-DD" },
  "periodo": "AAAA",
  "valores": { "SP": null, "RJ": null }
}
```

## O que existe hoje
| Arquivo | O que é | Script que gera |
|---|---|---|
| `geo/brasil-estados.json` | Contorno dos 27 estados (desenho do mapa) | `scripts/mapa-estados/` |
| `agro/brasil-estados-lavouras.json` | Valor e quantidade de 70 produtos das lavouras por estado | `scripts/lavouras-estados/` |
| `agro/brasil-estados-pecuaria.json` | Valor (e quantidade, quando há) de 9 produtos da pecuária por estado | `scripts/pecuaria-estados/` |
| `geo/eua-estados.json` | Contorno dos 50 estados dos EUA + DC | `scripts/eua-mapa-estados/` |
| `economia/eua-estados.json` | Peso no PIB, PIB por pessoa e crescimento por estado dos EUA | `scripts/eua-pib-estados/` |
| `agro/eua-estados.json` | Receita da venda de 94 produtos agropecuários por estado dos EUA | `scripts/eua-agro-estados/` |
| `geo/mundo-paises.json` | Mapa-múndi (países) | `scripts/mundo-mapa/` |
| `agora/brasil.json` | Dólar, Selic e IPCA 12 meses (faixa "Agora") | `scripts/brasil-agora/` |
| `mundo/temas.json` | Um número do mundo por tema | `scripts/mundo-temas/` |
| `industria/brasil-estados.json` | Indústria por estado e setor (valor da transformação e pessoas ocupadas) | `scripts/industria-estados/` |
| `servicos/brasil-estados.json` | Serviços por estado e atividade (valor adicionado e crescimento real) | `scripts/servicos-estados/` |
| `economia/brasil-estados.json` | Peso no PIB, PIB por pessoa e crescimento por estado | `scripts/pib-estados/` |
| `geo/brasil-sp-municipios.json` | Contorno dos 645 municípios de SP e das 11 regiões intermediárias do IBGE | `scripts/mapa-municipios/` |
| `economia/brasil-sp-municipios.json` | PIB, peso no PIB do estado, PIB por pessoa (2023) e setores (2021) por município de SP | `scripts/pib-municipios/` |
| `economia/brasil-sp-municipios-anos.json` | PIB e PIB por pessoa dos municípios de SP, 2010–2023, sem correção pela inflação | `scripts/pib-municipios/` |
| `economia/brasil-sp-atividade.json` | PIB mensal de SP (Seade) e IBCR-SP (Banco Central), mês a mês | `scripts/atividade-estado/` |
| `comercio/brasil-sp-municipios.json` | Exportações e importações por município de SP (ano em curso e último ano completo) | `scripts/comercio-municipios/` |
| `trabalho/brasil-municipios-caged.json` | Saldo de empregos com carteira por município do Brasil, mês a mês no ano | `scripts/caged-municipios/` |
| `geo/brasil-sp-bandeiras.json` | Bandeiras de SP e de 616 municípios: arquivo em public/bandeiras/br/sp/, autor e licença | `scripts/bandeiras-municipios/` |
| `demografia/brasil-estados.json` | População, crescimento, densidade, estimativas e idade (com pirâmides) do Brasil e dos estados | `scripts/populacao/` |
| `demografia/brasil-municipios.json` | O mesmo para os 5.570 municípios (sem a pirâmide completa) | `scripts/populacao/` |
| `demografia/brasil-estados-censo.json` | Cor ou raça, indígenas, quilombolas, domicílios e urbana × rural do Brasil e dos estados (Censo 2022) | `scripts/demografia-censo/` |
| `demografia/brasil-municipios-censo.json` | O mesmo para os 5.570 municípios | `scripts/demografia-censo/` |
| `demografia/brasil-series.json` | Pirâmides 1980–2070, projeção 2000–2070, Registro Civil 2015–2024 e migração (Brasil e estados) | `scripts/demografia-series/` |
| `demografia/brasil-municipios-vital.json` | Nascimentos e óbitos do último ano, por município | `scripts/demografia-series/` |
| `demografia/brasil-sp-piramides.json` | Pirâmide etária (Censo 2022) de cada município de SP | `scripts/piramides-municipios/` |
| `infraestrutura/brasil-ferrovias.json` | Ferrovias: traçado (GeoJSON) e situação, bitola, concessão de cada trecho | `scripts/ferrovias/` |
