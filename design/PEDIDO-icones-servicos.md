# Pedido ao Claude Design: ícones e cores das atividades de serviços

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole.

---

O StatWorld vai ganhar a aba **Serviços** (Economia · Brasil · Serviços), no mesmo molde do Agro e da Indústria: mapa da **atividade líder** de cada estado, "quanto produz" de cada atividade e uma página por atividade. As atividades são as das Contas Regionais do IBGE.

Use o Design System **StatWorld** e não crie estilo novo.

**1. Ícones, no MESMO estilo dos ícones do agro e da indústria que já existem**
Grade 24×24, só traço, uma cor (`currentColor`), pontas arredondadas, traço 1,5, legível a 14 px dentro do mapa. Um ícone por atividade, com o nome exatamente igual ao da lista:

- `comercio`: comércio e reparação de veículos (lojas, atacado, oficinas)
- `transporte`: transporte, armazenagem e correio
- `informacao-comunicacao`: telecomunicações, internet, TV, software
- `financeiras`: bancos, seguros e serviços financeiros
- `imobiliarias`: atividades imobiliárias, incluindo aluguel de imóveis
- `administracao-publica`: administração, defesa, educação e saúde públicas
- `outros-servicos`: alojamento e alimentação, educação e saúde privadas, serviços profissionais, artes, serviços domésticos
- `servicos`: ícone geral de serviços, para a aba e o tema

**2. Cores das atividades, no mesmo padrão das cores de produto e de setor**
Valores `oklch` para os temas claro e escuro, com prefixo `--sv-` (ex.: `--sv-comercio`), para as 7 atividades acima e para `outro` (cinza neutro). Elas precisam:
- ser bem diferentes entre si (estados vizinhos podem ter atividades líderes diferentes);
- funcionar no degradê de 6 tons do "quanto produz" (da cor clara à forte);
- não se confundir com as cores mais usadas do agro (soja verde, gado vermelho-terroso) nem da indústria (alimentos laranja, petróleo azul-escuro).

**Entrega:** a mesma forma de antes: uma página HTML de prévia com os ícones lado a lado, com o nome embaixo, nos tamanhos do mapa e do ranking, nos temas claro e escuro, e um bloco de estilo com as cores `--sv-*` em `:root` (claro) e `[data-theme=dark]` (escuro).

---

Quando receber, salve o arquivo HTML na pasta `design/icones-servicos/` e avise o Claude.
