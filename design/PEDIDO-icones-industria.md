# Pedido ao Claude Design: ícones e cores dos setores da indústria

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole.

---

O StatWorld vai ganhar a aba **Indústria** (Economia · Brasil · Indústria), no mesmo molde do Agro: um mapa de **setor líder** de cada estado, "quanto produz" de cada setor e uma página por setor. Os setores são as divisões da indústria usadas pelo IBGE.

Use o Design System **StatWorld** e não crie estilo novo.

**1. Ícones, no MESMO estilo dos ícones do agro que já estão no Design System**
Grade 24×24, só traço, uma cor (`currentColor`), pontas arredondadas, traço 1,5, legível a 14 px dentro do mapa. Um ícone por setor, com o nome do arquivo exatamente igual ao da lista. Setores parecidos precisam ser diferentes entre si (por exemplo, máquinas elétricas, máquinas e equipamentos e eletrônicos; extração de petróleo e derivados de petróleo).

Indústria extrativa:
- `extracao-carvao`: extração de carvão mineral
- `extracao-petroleo-gas`: extração de petróleo e gás natural
- `extracao-minerais-metalicos`: extração de minerais metálicos (ex.: minério de ferro)
- `extracao-minerais-nao-metalicos`: extração de pedras, areia, argila
- `apoio-extracao`: serviços de apoio à extração (ex.: perfuração)

Indústria de transformação:
- `alimentos`: produtos alimentícios
- `bebidas`
- `produtos-do-fumo`: cigarros (diferente do ícone de folha de fumo do agro)
- `texteis`: tecidos e fios
- `vestuario`: roupas e acessórios
- `couro-calcados`: couro e calçados
- `madeira`: produtos de madeira
- `celulose-papel`
- `impressao`: impressão e gravações
- `derivados-petroleo`: refinarias e biocombustíveis
- `quimicos`
- `farmaceuticos`
- `borracha-plastico`
- `cimento-vidro-ceramica`: minerais não metálicos
- `metalurgia`: aço, alumínio, fundição
- `produtos-de-metal`: estruturas, ferramentas, embalagens de metal
- `eletronicos-informatica`: computadores, celulares, ópticos
- `maquinas-eletricas`: motores, geradores, eletrodomésticos
- `maquinas-equipamentos`: máquinas industriais e agrícolas
- `veiculos`: carros, caminhões, autopeças
- `outros-transportes`: aviões, navios, trens
- `moveis`
- `produtos-diversos`: joias, brinquedos, instrumentos
- `manutencao-reparacao`: manutenção e instalação de máquinas

Outros (para uso futuro):
- `construcao`
- `energia-saneamento`: eletricidade, gás, água e esgoto
- `industria`: ícone geral da indústria (fábrica), para a aba e para o tema

**2. Cores dos setores, no mesmo padrão das cores de produto (`--p-*`)**
Valores `oklch` para os temas claro e escuro, com prefixo `--s-` (ex.: `--s-alimentos`). Cores para os setores que mais aparecem como líderes: `alimentos`, `bebidas`, `extracao-petroleo-gas`, `extracao-minerais-metalicos`, `derivados-petroleo`, `quimicos`, `metalurgia`, `veiculos`, `celulose-papel`, `maquinas-equipamentos`, `eletronicos-informatica`, `borracha-plastico`, `cimento-vidro-ceramica`, `farmaceuticos`, e `outro` (cinza neutro). Elas precisam ser bem diferentes entre si, porque estados vizinhos podem ter setores diferentes, e cada cor precisa funcionar no degradê de 6 tons do "quanto produz" (da cor clara à forte).

**Entrega:** a mesma forma de antes: uma página HTML de prévia com todos os ícones lado a lado, com o nome embaixo, no tamanho do mapa e no do ranking, nos temas claro e escuro, e um bloco de estilo com as cores `--s-*` em `:root` (claro) e `[data-theme=dark]` (escuro).

---

Quando receber, salve o arquivo HTML na pasta `design/icones-industria/` e avise o Claude.
