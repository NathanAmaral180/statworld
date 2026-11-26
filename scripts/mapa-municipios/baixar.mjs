// Baixa o contorno dos municípios de um estado (IBGE) e transforma em desenho (SVG)
// pronto para o site, com a região de cada município e o contorno das regiões.
// Gera: dados/geo/brasil-<uf>-municipios.json (ex.: brasil-sp-municipios.json)
// Como rodar (na pasta statworld):  node scripts/mapa-municipios/baixar.mjs
// Outro estado (PowerShell):        $env:UF="MG"; node scripts/mapa-municipios/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const UF = (process.env.UF ?? 'SP').toUpperCase();
const API = 'https://servicodados.ibge.gov.br/api';
const GEOJSON = 'formato=application/vnd.geo%2Bjson&qualidade=minima';
const LARGURA = 1000; // largura do desenho, em unidades do SVG

async function baixarJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${url}`);
  return r.json();
}

const estados = await baixarJson(`${API}/v1/localidades/estados`);
const estado = estados.find((e) => e.sigla === UF);
if (!estado) throw new Error(`Estado desconhecido: ${UF}`);
const [malha, municipios] = await Promise.all([
  baixarJson(`${API}/v3/malhas/estados/${estado.id}?${GEOJSON}&intrarregiao=municipio`),
  baixarJson(`${API}/v1/localidades/estados/${estado.id}/municipios`),
]);
const porCodigo = new Map(municipios.map((m) => [String(m.id), m]));
// Regiões geográficas intermediárias do IBGE (divisão de 2017): uma malha por região.
const idsRegioes = [...new Set(municipios.map((m) => m['regiao-imediata']['regiao-intermediaria'].id))].sort();
const malhasRegioes = await Promise.all(idsRegioes.map((id) => baixarJson(`${API}/v3/malhas/regioes-intermediarias/${id}?${GEOJSON}`)));

function aneis(g) {
  if (g.type === 'Polygon') return g.coordinates;
  if (g.type === 'MultiPolygon') return g.coordinates.flat();
  throw new Error(`Tipo de geometria inesperado: ${g.type}`);
}
const poligonos = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const r1 = (n) => Math.round(n * 10) / 10;

// Projeção simples (equiretangular corrigida pela latitude média): suficiente para um estado.
const pontos = malha.features.flatMap((f) => aneis(f.geometry).flat());
let [minLon, maxLon, minLat, maxLat] = [Infinity, -Infinity, Infinity, -Infinity];
for (const [lon, lat] of pontos) {
  minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
  minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
}
const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const escala = LARGURA / ((maxLon - minLon) * kx);
const ALTURA = Math.round((maxLat - minLat) * escala);
const projetar = ([lon, lat]) => [(lon - minLon) * kx * escala, (maxLat - lat) * escala];

// Centro de um polígono (centroide pela área).
function centroide(anel) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [x0, y0] = anel[j], [x1, y1] = anel[i];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a /= 2;
  return { area: Math.abs(a), x: cx / (6 * a), y: cy / (6 * a) };
}
function desenhar(geometry) {
  const polis = poligonos(geometry).map((p) => p.map((anel) => anel.map(projetar)));
  const caminho = polis
    .map((p) => p.map((anel) => 'M' + anel.map(([x, y]) => `${r1(x)},${r1(y)}`).join('L') + 'Z').join(''))
    .join('');
  const maior = polis.map((p) => centroide(p[0])).sort((a, b) => b.area - a.area)[0];
  return { caminho, centro: [r1(maior.x), r1(maior.y)], area: maior.area };
}

const unidades = malha.features.map((f) => {
  const codigo = String(f.properties.codarea);
  const info = porCodigo.get(codigo);
  if (!info) throw new Error(`Código de município desconhecido na malha: ${codigo}`);
  const { caminho, centro, area } = desenhar(f.geometry);
  if (!(area > 0)) throw new Error(`Município sem área no desenho: ${info.nome}`);
  const imediata = info['regiao-imediata'];
  return {
    codigo,
    sigla: codigo, // o molde usa "sigla" como identificador; município não tem sigla, então vai o código do IBGE
    nome: info.nome,
    regiao: imediata['regiao-intermediaria'].nome,
    codigoRegiao: String(imediata['regiao-intermediaria'].id),
    regiaoImediata: imediata.nome,
    caminho,
    centro,
  };
}).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

if (unidades.length !== municipios.length) throw new Error(`Esperava ${municipios.length} municípios, vieram ${unidades.length}`);

const regioes = malhasRegioes.map((m, i) => {
  const id = String(idsRegioes[i]);
  const nome = municipios.find((x) => String(x['regiao-imediata']['regiao-intermediaria'].id) === id)['regiao-imediata']['regiao-intermediaria'].nome;
  const { caminho, centro } = desenhar(m.features[0].geometry);
  return { codigo: id, nome, municipios: unidades.filter((u) => u.codigoRegiao === id).length, caminho, centro };
});

const arquivo = `brasil-${UF.toLowerCase()}-municipios`;
const SAIDA = new URL(`../../dados/geo/${arquivo}.json`, import.meta.url);
const saida = {
  _explicacao: `Contorno dos municípios de ${estado.nome}, já convertido em desenho SVG, com as regiões geográficas intermediárias do IBGE. Gerado por scripts/mapa-municipios/baixar.mjs. Não edite à mão.`,
  fonte: {
    nome: 'IBGE',
    publicacao: 'API de Malhas Territoriais (qualidade mínima) e API de Localidades',
    url: 'https://servicodados.ibge.gov.br/api/docs/malhas?versao=3',
    baixadoEm: new Date().toISOString().slice(0, 10),
  },
  estado: { codigo: String(estado.id), sigla: estado.sigla, nome: estado.nome },
  nivel: 'municipio',
  largura: LARGURA,
  altura: ALTURA,
  regioes,
  unidades,
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 1));
console.log(`Pronto: ${unidades.length} municípios e ${regioes.length} regiões de ${estado.nome} salvos em dados/geo/${arquivo}.json`);
