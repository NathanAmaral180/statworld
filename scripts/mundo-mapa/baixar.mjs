// Baixa as fronteiras dos países (Natural Earth, escala 1:110 milhões) e desenha o mapa-múndi
// na projeção "Equal Earth" (áreas proporcionais). Gera: dados/geo/mundo-paises.json
// Como rodar (na pasta statworld):  node scripts/mundo-mapa/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';

const VERSAO = '2.0.2';
const URL_MALHA = `https://cdn.jsdelivr.net/npm/world-atlas@${VERSAO}/countries-110m.json`;
const SAIDA = new URL('../../dados/geo/mundo-paises.json', import.meta.url);
const LARGURA = 1000;
const SEM = new Set(['010']); // Antártida: fica fora do mapa da página inicial

// Projeção Equal Earth (Šavrič, Patterson e Jenny, 2018).
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
function equalEarth([lon, lat]) {
  const l = (lon * Math.PI) / 180, f = (lat * Math.PI) / 180;
  const t = Math.asin(M * Math.sin(f)), t2 = t * t, t6 = t2 * t2 * t2;
  return [
    (l * Math.cos(t)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))),
    t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)),
  ];
}

const r = await fetch(URL_MALHA);
if (!r.ok) throw new Error(`Não consegui baixar as fronteiras (${r.status}) em ${URL_MALHA}`);
const topo = await r.json();
const paises = feature(topo, topo.objects.countries).features.filter((f) => f.geometry && !SEM.has(f.id));

// Países que cruzam a linha de 180° (ex.: Fiji, Rússia) têm anéis que "pulam" de +180 para −180,
// o que desenharia uma linha atravessando o mapa. Nesses anéis, os pontos do lado negativo
// são encostados na borda direita (180°).
function corrigeAntimeridiano(anel) {
  const pula = anel.some((p, i) => i > 0 && Math.abs(p[0] - anel[i - 1][0]) > 180);
  return pula ? anel.map(([lon, lat]) => [lon < 0 ? 180 : lon, lat]) : anel;
}
for (const p of paises) {
  const g = p.geometry;
  if (g.type === 'Polygon') g.coordinates = g.coordinates.map(corrigeAntimeridiano);
  else g.coordinates = g.coordinates.map((poli) => poli.map(corrigeAntimeridiano));
}

// Limites do desenho a partir de todos os pontos.
const polis = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const p of paises) for (const poli of polis(p.geometry)) for (const anel of poli) for (const pt of anel) {
  const [x, y] = equalEarth(pt);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const escala = LARGURA / (maxX - minX);
const ALTURA = Math.round((maxY - minY) * escala);
const proj = (pt) => { const [x, y] = equalEarth(pt); return [(x - minX) * escala, (maxY - y) * escala]; };
const r1 = (n) => Math.round(n * 10) / 10;
function centroide(anel) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [x0, y0] = anel[j], [x1, y1] = anel[i], f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a /= 2;
  return { area: Math.abs(a), x: cx / (6 * a), y: cy / (6 * a) };
}

const unidades = paises.map((p) => {
  const ps = polis(p.geometry).map((poli) => poli.map((anel) => anel.map(proj)));
  const caminho = ps.map((poli) => poli.map((anel) => 'M' + anel.map(([x, y]) => `${r1(x)},${r1(y)}`).join('L') + 'Z').join('')).join('');
  const maior = ps.map((poli) => centroide(poli[0])).sort((a, b) => b.area - a.area)[0];
  return { codigo: String(p.id), nomeOriginal: p.properties.name, caminho, centro: [r1(maior.x), r1(maior.y)] };
}).sort((a, b) => a.codigo.localeCompare(b.codigo));

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Países do mundo (sem a Antártida), já desenhados em SVG na projeção Equal Earth. "codigo" = código numérico ISO 3166. Gerado por scripts/mundo-mapa/baixar.mjs. Não edite à mão.',
  fonte: { nome: 'Natural Earth', publicacao: `Admin 0 – Countries, 1:110 milhões (via world-atlas ${VERSAO})`, url: 'https://www.naturalearthdata.com/', baixadoEm: new Date().toISOString().slice(0, 10) },
  nivel: 'pais',
  largura: LARGURA,
  altura: ALTURA,
  unidades,
}));
console.log(`Pronto: ${unidades.length} países salvos em dados/geo/mundo-paises.json (${LARGURA}×${ALTURA})`);
