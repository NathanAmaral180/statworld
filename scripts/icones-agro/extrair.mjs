// Tira os ícones e as cores dos produtos de dentro da página de prévia do Claude Design
// e salva em arquivos que o site usa.
// Lê:   design/icones/Prévia dos ícones agro.html
// Gera: design/icones/svg/<produto>.svg        (um arquivo por ícone, para guardar)
//       src/config/icones/agro.json            (ícones e lista de produtos com cor, usado pelo site)
//       src/estilos/cores-produtos.css         (cores dos produtos, temas claro e escuro)
// Como rodar (na pasta statworld):  node scripts/icones-agro/extrair.mjs

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const PASTA = new URL('../../design/icones/', import.meta.url);
const arquivos = (await readdir(PASTA)).filter((f) => f.toLowerCase().endsWith('.html'));
if (arquivos.length !== 1) throw new Error(`Esperava 1 arquivo .html em design/icones/, achei ${arquivos.length}`);
let html = await readFile(new URL(arquivos[0], PASTA), 'utf8');

// A prévia do Claude Design vem "empacotada": a página de verdade fica dentro de um <script>.
const tpl = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (tpl) html = JSON.parse(tpl[1]);
const man = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (man && !html.includes('<figure class="t">')) {
  for (const v of Object.values(JSON.parse(man[1]))) {
    const t = (v.compressed ? gunzipSync(Buffer.from(v.data, 'base64')) : Buffer.from(v.data, 'base64')).toString('utf8');
    if (t.includes('<figure class="t">')) { html = t; break; }
  }
}

// ---- ícones ----
const icones = {};
for (const f of html.matchAll(/<figure class="t">([\s\S]*?)<figcaption>([^<]*)<\/figcaption><\/figure>/g)) {
  const nome = f[2].trim();
  if (icones[nome]) continue;
  const m = f[1].match(/<div class="rk"><svg class="ic" viewBox="0 0 24 24">([\s\S]*?)<\/svg><\/div>/);
  if (!m) throw new Error(`Não achei o desenho do ícone "${nome}"`);
  // Segurança: só aceita formas simples de desenho.
  const tags = [...m[1].matchAll(/<\/?([a-zA-Z]+)/g)].map((t) => t[1]);
  if (tags.some((t) => !['path', 'circle', 'ellipse', 'g', 'line', 'rect', 'polyline', 'polygon'].includes(t)) || /\son\w+=|href|<script|url\(/i.test(m[1])) {
    throw new Error(`O ícone "${nome}" tem algo diferente de um desenho simples; confira com o Claude`);
  }
  icones[nome] = m[1];
}
if (Object.keys(icones).length < 10) throw new Error(`Só achei ${Object.keys(icones).length} ícones; o formato da prévia mudou?`);

// ---- cores ----
const bloco = (sel) => html.match(new RegExp(sel + '\\s*\\{([^}]*)\\}'))?.[1] ?? '';
const lerCores = (txt) => Object.fromEntries([...txt.matchAll(/--p-([a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const claro = lerCores(bloco(':root'));
const escuro = lerCores(bloco('\\[data-theme=dark\\]'));
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

const cfg = new URL('../../src/config/icones/', import.meta.url);
await mkdir(cfg, { recursive: true });
await writeFile(new URL('agro.json', cfg), JSON.stringify({
  _explicacao: 'Gerado por scripts/icones-agro/extrair.mjs a partir da prévia do Claude Design. Não edite à mão.',
  origem: `design/icones/${arquivos[0]}`,
  comCor: Object.keys(claro),
  icones,
}, null, 1));

const linhas = (o) => Object.entries(o).map(([k, v]) => `  --p-${k}: ${v};`).join('\n');
const classes = Object.keys(claro).map((k) => `[data-classe="p-${k}"] { --cor: var(--p-${k}); }`).join('\n');
await writeFile(new URL('../../src/estilos/cores-produtos.css', import.meta.url),
  `/* Cores dos produtos (Claude Design). Gerado por scripts/icones-agro/extrair.mjs. Não edite à mão. */\n:root {\n${linhas(claro)}\n}\n:root[data-theme="dark"] {\n${linhas(escuro)}\n}\n${classes}\n`);

console.log(`Pronto: ${Object.keys(icones).length} ícones e ${Object.keys(claro).length} cores extraídos.`);
