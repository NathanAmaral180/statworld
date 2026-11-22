// Baixa as fronteiras dos países (Natural Earth, escala 1:110 milhões) e desenha o mapa-múndi
// exatamente como no design da página inicial (rodada 3): projeção Natural Earth girada 10°,
// contorno do globo e grade a cada 10°. Gera: dados/geo/mundo-paises.json
// Como rodar (na pasta statworld):  node scripts/mundo-mapa/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';

const VERSAO = '2.0.2';
const URL_MALHA = `https://cdn.jsdelivr.net/npm/world-atlas@${VERSAO}/countries-110m.json`;
const SAIDA = new URL('../../dados/geo/mundo-paises.json', import.meta.url);
const LARGURA = 960, ALTURA = 470; // mesmas medidas do design
const SEM = new Set(['010']); // Antártida fica fora, como no design

const r = await fetch(URL_MALHA);
if (!r.ok) throw new Error(`Não consegui baixar as fronteiras (${r.status}) em ${URL_MALHA}`);
const topo = await r.json();
const paises = feature(topo, topo.objects.countries).features.filter((f) => f.geometry && !SEM.has(f.id));

// A biblioteca d3-geo corta sozinha os países que cruzam a linha de 180° (Fiji, Rússia).
const proj = geoNaturalEarth1().rotate([-10, 0]).fitExtent([[4, 4], [LARGURA - 4, ALTURA - 4]], { type: 'Sphere' });
const caminho = geoPath(proj).digits(1);
const r1 = (n) => Math.round(n * 10) / 10;

const unidades = paises.map((p) => {
  const [x, y] = caminho.centroid(p);
  return { codigo: String(p.id), nomeOriginal: p.properties.name, caminho: caminho(p), centro: [r1(x), r1(y)] };
}).sort((a, b) => a.codigo.localeCompare(b.codigo));

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Países do mundo (sem a Antártida), desenhados em SVG como no design da página inicial: projeção Natural Earth girada 10°. "codigo" = código numérico ISO 3166. "esfera" = contorno do globo; "grade" = linhas a cada 10°. Gerado por scripts/mundo-mapa/baixar.mjs. Não edite à mão.',
  fonte: { nome: 'Natural Earth', publicacao: `Admin 0 – Countries, 1:110 milhões (via world-atlas ${VERSAO})`, url: 'https://www.naturalearthdata.com/', baixadoEm: new Date().toISOString().slice(0, 10) },
  nivel: 'pais',
  largura: LARGURA,
  altura: ALTURA,
  esfera: caminho({ type: 'Sphere' }),
  grade: caminho(geoGraticule10()),
  unidades,
}));
console.log(`Pronto: ${unidades.length} países salvos em dados/geo/mundo-paises.json (${LARGURA}×${ALTURA})`);
