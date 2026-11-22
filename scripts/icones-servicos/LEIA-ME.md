# Script: ícones e cores das atividades de serviços

## O que faz
O Claude Design entregou os ícones e as cores das atividades de serviços dentro de uma página de prévia (`design/icones-servicos/Ícones e cores · Serviços.html`). Nessa página, ícones e cores ficam em listas dentro do código (`ICONS` e `SV`).
Este script separa esse conteúdo em arquivos que o site usa:

| Arquivo criado | Para que serve |
|---|---|
| `design/icones-servicos/svg/<atividade>.svg` | Um arquivo por ícone (8), para guardar |
| `src/config/icones/servicos.json` | Os desenhos dos ícones, usados no mapa, no ranking e na ficha |
| `src/estilos/cores-servicos.css` | A cor de cada atividade (`--sv-*`), nos temas claro e escuro |

## Como rodar
1. Coloque o arquivo `.html` novo na pasta `design/icones-servicos/`, apagando o antigo. Precisa ficar **um só** `.html` lá.
2. Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/icones-servicos/extrair.mjs
```

Deve aparecer: `Pronto: 8 ícones e 8 cores extraídos.`

## Segurança
O script só aceita desenhos simples (comandos de linha e curva) e cores no formato `oklch(...)`. Qualquer outra coisa faz ele parar e avisar.

## Se der erro
- "Não achei a lista de ícones (ICONS)": o Claude Design montou a prévia de outro jeito. Peça ajuda ao Claude, porque cada prévia pode vir num formato diferente (a do agro e a da indústria também vieram diferentes).
