# Script: Universo dos Fios (protótipo)

## O que faz
Monta o "universo" da seção Fios (`/fios/universo`): centenas de criações, descobertas e pessoas da humanidade, ligadas entre si, num emaranhado que se explora com zoom.

São três programas:

| Programa | O que faz |
|---|---|
| `baixar.mjs` | Baixa a matéria-prima e guarda em `cache/` (fora do GitHub). Rodar de novo só baixa o que falta. |
| `montar.mjs` | Escolhe os itens, liga uns aos outros, calcula a posição de cada ponto e as regiões, junta as trilhas conferidas. Gera `dados/fios/universo.json`. |
| `fotos.mjs` | Para cada item, pega a foto principal (ou o logo, para marcas e programas) no Wikidata e o autor e a licença no Wikimedia Commons. Só entram licenças livres. Gera `dados/fios/fotos.json`. Rodar depois do `montar.mjs`. |
| `escolher.mjs` | A regra de quem entra (usada pelos dois): criações, descobertas e ideias com ano, e as pessoas. Saem lugares, países, épocas, empresas, obras de arte, dinastias etc. |

E um arquivo para preencher à mão: `regioes.json` (o nome de cada região; ver abaixo).

## De onde vêm os dados
1. **Lista de itens:** os artigos citados em duas páginas da Wikipédia em inglês: [Timeline of historic inventions](https://en.wikipedia.org/wiki/Timeline_of_historic_inventions) e [Timeline of scientific discoveries](https://en.wikipedia.org/wiki/Timeline_of_scientific_discoveries).
2. **Nome em português, descrição, tipo, ano, inventores, datas das pessoas:** [Wikidata](https://www.wikidata.org) (licença CC0, uso livre).
3. **Os fios (ligações):** quando o artigo de um item da Wikipédia cita o artigo de outro item da lista, eles ficam ligados. Também liga cada criação aos seus inventores (Wikidata).
4. **Itens conferidos:** os itens das trilhas em `dados/fios/*.json` (ex.: "Do telégrafo ao smartphone") entram com o selo "conferido" e se juntam ao item do Wikidata que tem o mesmo artigo da Wikipédia.

O Wikidata é uma fonte pública, mas pode ter erros. Por isso o site separa "conferido" (checado à mão) do resto ("dados do Wikidata").

## Como rodar
Abra o PowerShell na pasta `statworld` e digite, um de cada vez:

```
node scripts/fios-universo/baixar.mjs
node scripts/fios-universo/montar.mjs
```

O primeiro demora (de 15 minutos a mais de 1 hora): a Wikimedia limita o ritmo dos pedidos, e o programa espera quando ela pede ("a Wikimedia pediu calma"). Pode parar no meio (Ctrl+C) e rodar de novo depois: continua de onde parou.

## O que ele cria
- `scripts/fios-universo/cache/` (fora do GitHub): títulos, itens do Wikidata, links.
- `dados/fios/fotos.json`: arquivo de foto de cada item no Wikimedia Commons, autor e licença (aparecem no cartão: "Foto: autor, licença"). Os itens das trilhas conferidas que não existem no Wikidata ficam sem foto (mostram a inicial).
- `dados/fios/universo.json`: pontos (nome, ano, tipo, posição, tamanho, região, descrição, link da Wikipédia), fios e regiões. Não edite à mão.

## Nomes das regiões
As regiões são calculadas sozinhas (grupos de itens muito ligados entre si). O `montar.mjs` mostra, para cada região, o item mais ligado dela entre aspas, por exemplo: `chave "Telephone" → [Telefone · Rádio · Televisão]`.
Para dar um nome bonito, escreva em `regioes.json`: `{ "Telephone": "Comunicação" }` e rode `montar.mjs` de novo.

## Se der erro
- "A Wikimedia não respondeu depois de várias tentativas": espere um pouco (meia hora) e rode de novo.
- `montar.mjs` reclama de arquivo que não existe em `cache/`: rode `baixar.mjs` antes.
- O desenho mudou muito de um dia para outro: é normal; as posições são recalculadas a cada vez.
