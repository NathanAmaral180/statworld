# Script: ícones e cores dos setores da indústria

## O que faz
O Claude Design entregou os ícones e as cores dos setores da indústria dentro de uma página de prévia (`design/icones-industria/Icones e cores Industria (standalone).html`).
Este script separa o conteúdo dessa página em arquivos que o site usa:

| Arquivo criado | Para que serve |
|---|---|
| `design/icones-industria/svg/<setor>.svg` | Um arquivo por ícone (32), para guardar e reaproveitar |
| `src/config/icones/industria.json` | Os desenhos dos ícones e o que cada setor abrange |
| `src/estilos/cores-setores.css` | A cor de cada setor (`--s-*`), nos temas claro e escuro |

## Como rodar
Quando chegar uma prévia nova do Claude Design:
1. Coloque o arquivo `.html` na pasta `design/icones-industria/`, apagando a versão antiga. Precisa ficar **um só** arquivo `.html` lá (a folha de conferência fica fora dessa pasta, em `design/icones-industria-conferencia.html`).
2. Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/icones-industria/extrair.mjs
```

Deve aparecer: `Pronto: 32 ícones e 15 cores extraídos.`

## Segurança
O script só aceita desenhos simples (comandos de linha e curva). Se a prévia trouxer qualquer outra coisa, ele para e avisa.

## Se der erro
- "Esperava 1 arquivo .html": há mais de um (ou nenhum) `.html` na pasta.
- "Não achei a lista de ícones": o Claude Design mudou o jeito de montar a prévia. Peça ajuda ao Claude.
- "Não consegui ler as cores": a prévia veio sem o bloco de cores `--s-*`.
