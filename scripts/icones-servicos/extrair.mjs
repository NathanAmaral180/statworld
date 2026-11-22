// Tira os ícones e as cores das atividades de serviços de dentro da página de prévia do Claude Design
// e salva em arquivos que o site usa.
// Lê:   design/icones-servicos/<o único arquivo .html>
// Gera: design/icones-servicos/svg/<atividade>.svg   (um arquivo por ícone, para guardar)
//       src/config/icones/servicos.json              (ícones e lista de atividades com cor, usado pelo site)
//       src/estilos/cores-servicos.css               (cores das atividades, temas claro e escuro)
// Como rodar (na pasta statworld):  node scripts/icones-servicos/extrair.mjs

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';

const PASTA = new URL('../../design/icones-servicos/', import.meta.url);
const arquivos = (await readdir(PASTA)).filter((f) => f.toLowerCase().endsWith('.html'));
if (arquivos.length !== 1) throw new Error(`Esperava 1 arquivo .html em design/icones-servicos/, achei ${arquivos.length}`);
let html = await readFile(new URL(arquivos[0], PASTA), 'utf8');
const tpl = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (tpl) html = JSON.parse(tpl[1]); // a página de verdade fica dentro de um <script>

// ---- ícones: lista ICONS = [ ['nome', 'desenho'], ... ] ----
const bloco = html.match(/const ICONS\s*=\s*\[([\s\S]*?)\n\];/);
if (!bloco) throw new Error('Não achei a lista de ícones (ICONS) na prévia; o formato mudou? Peça ajuda ao Claude.');
const SO_DESENHO = /^[MmLlHhVvCcSsQqTtAaZz0-9 .,\-]+$/; // segurança: só comandos de desenho
const icones = {};
for (const m of bloco[1].matchAll(/\[\s*'([a-z0-9-]+)'\s*,\s*'([^']+)'\s*\]/g)) {
  if (!SO_DESENHO.test(m[2])) throw new Error(`O ícone "${m[1]}" tem algo diferente de um desenho simples`);
  icones[m[1]] = `<path d="${m[2]}"></path>`;
}
if (Object.keys(icones).length < 5) throw new Error(`Só achei ${Object.keys(icones).length} ícones`);

// ---- cores: SV = { light: { nome:'oklch(...)', ... }, dark: { ... } } ----
const lerTema = (tema) => {
  const b = html.match(new RegExp(`const SV\\s*=\\s*\\{[\\s\\S]*?${tema}\\s*:\\s*\\{([^}]*)\\}`));
  if (!b) return {};
  return Object.fromEntries([...b[1].matchAll(/'?([a-z0-9-]+)'?\s*:\s*'(oklch\([0-9. ]+\))'/g)].map((m) => [m[1], m[2]]));
};
const claro = lerTema('light'), escuro = lerTema('dark');
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
await writeFile(new URL('../../src/config/icones/servicos.json', import.meta.url), JSON.stringify({
  _explicacao: 'Gerado por scripts/icones-servicos/extrair.mjs a partir da prévia do Claude Design. Não edite à mão.',
  origem: `design/icones-servicos/${arquivos[0]}`,
  prefixoCor: 'sv-',
  comCor: Object.keys(claro),
  icones,
}, null, 1));
const linhas = (o) => Object.entries(o).map(([k, v]) => `  --sv-${k}: ${v};`).join('\n');
const classes = Object.keys(claro).map((k) => `[data-classe="sv-${k}"] { --cor: var(--sv-${k}); }`).join('\n');
await writeFile(new URL('../../src/estilos/cores-servicos.css', import.meta.url),
  `/* Cores das atividades de serviços (Claude Design). Gerado por scripts/icones-servicos/extrair.mjs. Não edite à mão. */\n:root {\n${linhas(claro)}\n}\n:root[data-theme="dark"] {\n${linhas(escuro)}\n}\n${classes}\n`);

console.log(`Pronto: ${Object.keys(icones).length} ícones e ${Object.keys(claro).length} cores extraídos.`);
