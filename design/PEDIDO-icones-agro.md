# Pedido ao Claude Design: ícones e cores dos produtos do agro

Copie o texto abaixo e cole no Claude Design (no mesmo projeto das telas "StatWorld · rodada 2").

---

Nas telas "Agro · produto líder" e "Soja", você criou ícones de produtos (a função `SW.icon`) e uma cor para cada produto (`--p-soja`, `--p-milho`, `--p-cafe`, `--p-cana`, `--p-gado`, `--p-arroz`, `--p-frango`, `--p-leite`, `--p-mandioca`, nos temas claro e escuro).

O HTML exportado não trouxe o arquivo com os ícones. Preciso de três coisas:

**1. Os ícones que já existem, sem mudar nada**
Exporte cada um como SVG separado, exatamente como estão (mesmo tamanho, traço e estilo): soja, milho, cafe, cana, gado, arroz, frango, leite, mandioca e a seta (arrow).

**2. Novos ícones, no MESMO estilo dos que já existem**
Siga o mesmo tamanho de quadro, a mesma espessura de traço, os mesmos cantos e o mesmo nível de detalhe. Cada ícone é um SVG com uma cor só (`currentColor`), sem texto e sem fundo, e precisa continuar legível no tamanho em que aparece dentro do mapa. Produtos parecidos precisam ser diferentes entre si (laranja, tangerina e limão; milho e milho-verde; ovos e ovos-de-codorna).

Lavouras: algodao-herbaceo, laranja, banana, fumo, cacau, tomate, feijao, uva, acai, trigo, batata-inglesa, abacaxi, morango, maca, amendoim, pimenta-do-reino, sorgo, manga, alface, maracuja, cebola, melancia, limao, dende, borracha, mamao, alho, tangerina, coco-da-baia, batata-doce, goiaba, pimentao, milho-verde, abacate, melao, aveia, cenoura, gergelim, repolho, inhame, erva-mate, abobora, pessego, graviola, chuchu, cevada, canola, caqui, castanha-de-caju, palmito, acerola, sisal-ou-agave, girassol, urucum, mamona, figo, fava, cupuacu, noz, guarana, pera, triticale, azeitona, malva

Pecuária e produtos de origem animal: suinos, ovos, ovos-de-codorna, mel, la, casulos-do-bicho-da-seda

Genérico: outro (para produto sem ícone próprio)

**3. Cores para mais produtos, no mesmo padrão das atuais**
Valores `oklch` para os temas claro e escuro, como já existe em `--p-soja`. Os produtos são: acai, uva, banana, laranja, cacau, algodao-herbaceo, suinos, ovos e outro (cinza neutro). As cores precisam ser bem diferentes entre si e das 9 que já existem, porque estados vizinhos podem ter produtos diferentes no mapa.

**Nomes dos arquivos:** exatamente os da lista (ex.: `soja.svg`; o gado pode se chamar `gado.svg`).

**Entrega:** um ZIP com os SVGs e um arquivo `cores.css` com todas as cores `--p-*` (claro e escuro), mais uma página HTML de prévia com todos os ícones lado a lado, com o nome embaixo, no tamanho do mapa e no tamanho do ranking, nos temas claro e escuro.

---

Quando receber, coloque tudo na pasta `design/icones/` e avise o Claude.
