# StatWorld · Brasil · opções 1a, 1b, 1c

Origem: exportação do Claude Design (HTML completo incluído: StatWorld-Brasil-design-completo.html).
Todas usam o mesmo sistema visual. Mudam só o layout da tela "A economia do Brasil".

## Layouts
- **1a Painel** (1440×968): medida à esquerda (Peso no PIB / PIB por pessoa / Crescimento), mapa no centro, ficha do estado à direita, 3 indicadores no topo. Tudo na primeira dobra.
- **1b Editorial** (1440×1522): coluna única, título grande, valores escritos dentro do mapa, ficha fixa sobre o oceano, dica ao passar o mouse.
- **1c Mapa e ranking** (1440×1171): mapa + ranking dos 27 estados ao lado, ligados por cursor e teclado. "Sem dado" listado e hachurado. (Parece ser a que você mostrou antes.)

## Tokens
Tema claro: bg #FFFFFF · surf #F3F4F6 · ink #111318 · sub #50565F · faint #676D76 · accent #2557C7 · hatch #B4BAC3 · track #EDEFF2 · bar #B9C6DC · line rgba(17,19,24,.10) · line2 rgba(17,19,24,.22)
Tema escuro: bg #0E1013 · surf #171A1F · ink #ECEEF1 · sub #A7ADB6 · faint #8F959E · accent #86AEF7 · hatch #434951 · track #1F232A · bar #3D4A60 · line rgba(236,238,241,.12) · line2 rgba(236,238,241,.26)

Rampa mapa, claro (6 classes, do menor ao maior):
oklch(0.955 0.018 250), oklch(0.885 0.045 250), oklch(0.795 0.085 252), oklch(0.675 0.125 254), oklch(0.535 0.145 257), oklch(0.395 0.125 260)
Rampa mapa, escuro:
oklch(0.315 0.035 255), oklch(0.405 0.065 255), oklch(0.505 0.095 254), oklch(0.615 0.115 252), oklch(0.735 0.105 250), oklch(0.865 0.065 248)

Cortes (5 limites = 6 classes):
- Peso no PIB (%): 0,5 · 1 · 2 · 4 · 8
- PIB por pessoa (R$): 25 mil · 30 mil · 40 mil · 50 mil · 70 mil
- Crescimento (%): 1,5 · 2,5 · 4 · 8 · 12

## Regras comuns
Fonte do sistema, números tabulares, fonte+data em todo dado, "sem dado" como estado próprio (hachura), estados pequenos com linha de chamada (RN, PB, PE, AL, SE, DF, ES, RJ), hover = prévia, clique = fixa.

## Para outros temas
Troque só a medida, os cortes e a legenda. Mapa, ficha, ranking e tokens ficam iguais.
