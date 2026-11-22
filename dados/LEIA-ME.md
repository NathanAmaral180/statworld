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
| `economia/brasil-estados.json` | Peso no PIB, PIB por pessoa e crescimento por estado | `scripts/pib-estados/` |
