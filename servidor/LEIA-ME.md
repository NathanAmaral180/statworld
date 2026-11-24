# Servidor: contador de visitas e painel do administrador

Programa pequeno (`servidor/index.js`) que roda na Cloudflare na frente do site. Ele só cuida de:

- **`/api/visita`**: cada página do site avisa que foi aberta (script no fim de `src/layouts/Base.astro`) e, ao sair, quanto tempo ficou à vista.
- **`/admin`**: o painel do administrador (`src/pages/admin/index.astro`), só com usuário e senha.
- **`/api/admin/numeros`**: os números que o painel mostra, também só com usuário e senha.

Todo o resto do site é entregue direto, sem passar pelo programa (`run_worker_first` no `wrangler.jsonc`).

## O que é guardado (e o que não é)

Banco D1 da Cloudflare chamado `statworld-visitas`, tabela `visitas`, uma linha por página aberta:
dia, hora (UTC), endereço da página, país (a Cloudflare informa), celular/computador/tablet, nome do site de onde veio (ex.: "Google") e segundos com a página à vista.

- **Sem cookies e nada guardado no navegador.**
- **O IP não é guardado.** Para contar pessoas diferentes no dia, o programa guarda um código embaralhado feito com IP + navegador + um "sal" (chave aleatória) do dia. O sal é apagado no dia seguinte: não dá para voltar ao IP nem reconhecer a pessoa em outro dia.
- Visitas com mais de 400 dias são apagadas sozinhas.
- Robôs conhecidos (Google etc.) não contam.
- O texto da política de privacidade (`src/pages/privacidade.astro`) descreve isso. Se mudar o que é guardado, mude a política e a data da versão.

## Senha do /admin

- Usuário: `admin`. Senha: o segredo **SENHA_ADMIN**, criado pelo dono no painel da Cloudflare:
  Workers & Pages → statworld → Settings → Variables and Secrets → Add → tipo **Secret**, nome `SENHA_ADMIN`.
- Para trocar a senha: editar esse mesmo segredo. Ninguém mais precisa saber; ela nunca vai para o GitHub.
- Quem confere a senha é o servidor: sem ela, nem a página nem os números saem da Cloudflare.
- No celular, o navegador pede usuário e senha numa janelinha e costuma lembrar.

## Testar no computador

```
npm run build
npx wrangler dev --local
```

Abre em http://127.0.0.1:8787 com um banco de teste. A senha de teste fica no arquivo `.dev.vars` (fora do GitHub), linha `SENHA_ADMIN=...`.
No `npm run dev` comum o contador não roda (o painel avisa).

## Se der erro

- **Painel diz "ainda não tem senha"**: falta o segredo SENHA_ADMIN na Cloudflare.
- **Painel diz "banco de visitas ainda não está ligado"**: falta o banco D1 no `wrangler.jsonc` (`d1_databases`, com o `database_id` certo). Para criar outro: `npx wrangler login` e `npx wrangler d1 create statworld-visitas`.
- **Build da Cloudflare falhou depois de mexer aqui**: ver o log em Workers & Pages → statworld → Deployments.
- As tabelas são criadas sozinhas na primeira visita; não há nada a rodar à mão.
