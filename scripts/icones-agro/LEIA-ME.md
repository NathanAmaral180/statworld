# Script: ícones e cores dos produtos do agro

## O que faz
O Claude Design entregou os ícones e as cores dos produtos dentro de uma página de prévia (`design/icones/Prévia dos ícones agro.html`).
Este script separa o conteúdo dessa página em arquivos que o site usa:

| Arquivo criado | Para que serve |
|---|---|
| `design/icones/svg/<produto>.svg` | Um arquivo por ícone, para guardar e reaproveitar |
| `src/config/icones/agro.json` | Os desenhos dos ícones, usados no mapa, no ranking e na ficha |
| `src/estilos/cores-produtos.css` | A cor de cada produto, nos temas claro e escuro |

## De onde vêm
Do Claude Design. Não são dados: são desenho.

## Como rodar
Quando chegar uma prévia nova do Claude Design:
1. Coloque o arquivo `.html` na pasta `design/icones/`, apagando a versão antiga. Precisa ficar **um só** arquivo `.html` lá.
2. Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/icones-agro/extrair.mjs
```

Deve aparecer algo como: `Pronto: 81 ícones e 18 cores extraídos.`

## Segurança
O script só aceita desenhos simples (linhas, círculos, caminhos). Se a prévia trouxer qualquer outra coisa, ele para e avisa.

## Se der erro
- "Esperava 1 arquivo .html": há mais de um (ou nenhum) arquivo `.html` na pasta `design/icones/`.
- "Não achei o desenho" ou "formato da prévia mudou": o Claude Design mudou o jeito de montar a prévia. Peça ajuda ao Claude.
- "tem algo diferente de um desenho simples": não use esse arquivo; peça ao Claude Design para refazer o ícone.
