// Tira os ícones e as cores dos setores da indústria de dentro da página de prévia do Claude Design
// e salva em arquivos que o site usa.
// Lê:   design/icones-industria/<o único arquivo .html>
// Gera: design/icones-industria/svg/<setor>.svg   (um arquivo por ícone, para guardar)
//       src/config/icones/industria.json          (ícones e lista de setores com cor, usado pelo site)
//       src/estilos/cores-setores.css             (cores dos setores, temas claro e escuro)
// Como rodar (na pasta statworld):  node scripts/icones-industria/extrair.mjs

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';

const PASTA = new URL('../../design/icones-industria/', import.meta.url);
const arquivos = (await readdir(PASTA)).filter((f) => f.toLowerCase().endsWith('.html'));
if (arquivos.length !== 1) throw new Error(`Esperava 1 arquivo .html em design/icones-industria/, achei ${arquivos.length}`);
let html = await readFile(new URL(arquivos[0], PASTA), 'utf8');

// A prévia do Claude Design vem "empacotada": a página de verdade fica dentro de um <script>.
const tpl = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (tpl) html = JSON.parse(tpl[1]);

// ---- ícones: ficam num bloco de dados {"groups":[{"items":[{"k","d","paths"}]}]} ----
const ini = html.indexOf('{"groups":');
if (ini < 0) throw new Error('Não achei a lista de ícones na prévia; o formato mudou? Peça ajuda ao Claude.');
let nivel = 0, fim = -1, emTexto = false;
for (let i = ini; i < html.length; i++) {
  const c = html[i];
  if (emTexto) { if (c === '\\') i++; else if (c === '"') emTexto = false; continue; }
  if (c === '"') emTexto = true;
  else if (c === '{') nivel++;
  else if (c === '}' && --nivel === 0) { fim = i + 1; break; }
}
const dados = JSON.parse(html.slice(ini, fim));
const SO_DESENHO = /^[MmLlHhVvCcSsQqTtAaZz0-9 .,\-]+$/; // segurança: só comandos de desenho
const icones = {};
const descricoes = {};
for (const g of dados.groups) for (const item of g.items) {
  if (!/^[a-z0-9-]+$/.test(item.k)) throw new Error(`Nome de ícone estranho: ${item.k}`);
  for (const p of item.paths) if (!SO_DESENHO.test(p)) throw new Error(`O ícone "${item.k}" tem algo diferente de um desenho simples`);
  icones[item.k] = item.paths.map((d) => `<path d="${d}"></path>`).join('');
  descricoes[item.k] = item.d;
}
if (Object.keys(icones).length < 10) throw new Error(`Só achei ${Object.keys(icones).length} ícones`);

// ---- cores --s-* (claro em :root, escuro em [data-theme=dark]) ----
const bloco = (sel) => html.match(new RegExp(sel + '\\s*\\{([^}]*--s-[^}]*)\\}'))?.[1] ?? '';
const lerCores = (txt) => Object.fromEntries([...txt.matchAll(/--s-([a-z0-9-]+)\s*:\s*([^;}]+)/g)].map((m) => [m[1], m[2].trim()]));
const claro = lerCores(bloco(':root'));
const escuro = lerCores(bloco('\\[data-theme=["\']?dark["\']?\\]'));
if (!Object.keys(claro).length || Object.keys(claro).length !== Object.keys(escuro).length) {
  throw new Error('Não consegui ler as cores dos temas claro e escuro');
}

// ---- salvar ----
const svgDir = new URL('svg/', PASTA);
await mkdir(svgDir, { recursive: true });
for (const [nome, corpo] of Object.entries(icones)) {
  await writeFile(new URL(`${nome}.svg`, svgDir),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${corpo}</svg>\n`);
}
await mkdir(new URL('../../src/config/icones/', import.meta.url), { recursive: true });
await writeFile(new URL('../../src/config/icones/industria.json', import.meta.url), JSON.stringify({
  _explicacao: 'Gerado por scripts/icones-industria/extrair.mjs a partir da prévia do Claude Design. Não edite à mão. "descricoes" = o que cada setor abrange.',
  origem: `design/icones-industria/${arquivos[0]}`,
  prefixoCor: 's-',
  comCor: Object.keys(claro),
  descricoes,
  icones,
}, null, 1));
const linhas = (o) => Object.entries(o).map(([k, v]) => `  --s-${k}: ${v};`).join('\n');
const classes = Object.keys(claro).map((k) => `[data-classe="s-${k}"] { --cor: var(--s-${k}); }`).join('\n');
await writeFile(new URL('../../src/estilos/cores-setores.css', import.meta.url),
  `/* Cores dos setores da indústria (Claude Design). Gerado por scripts/icones-industria/extrair.mjs. Não edite à mão. */\n:root {\n${linhas(claro)}\n}\n:root[data-theme="dark"] {\n${linhas(escuro)}\n}\n${classes}\n`);

console.log(`Pronto: ${Object.keys(icones).length} ícones e ${Object.keys(claro).length} cores extraídos.`);
