// Baixa o contorno dos estados do Brasil (IBGE) e transforma em desenho (SVG)
// pronto para o site. Gera: dados/geo/brasil-estados.json
// Como rodar (na pasta statworld):  node scripts/mapa-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const URL_MALHA =
  'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=UF';
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const SAIDA = new URL('../../dados/geo/brasil-estados.json', import.meta.url);
const LARGURA = 1000; // largura do desenho, em unidades do SVG

async function baixarJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${url}`);
  return r.json();
}

const [malha, estados] = await Promise.all([baixarJson(URL_MALHA), baixarJson(URL_ESTADOS)]);
const porCodigo = new Map(estados.map((e) => [String(e.id), e]));

// Projeção simples (equiretangular corrigida pela latitude média): suficiente para um país.
const pontos = malha.features.flatMap((f) => aneis(f.geometry).flat());
const lons = pontos.map((p) => p[0]);
const lats = pontos.map((p) => p[1]);
const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const escala = LARGURA / ((maxLon - minLon) * kx);
const ALTURA = Math.round((maxLat - minLat) * escala);
const projetar = ([lon, lat]) => [(lon - minLon) * kx * escala, (maxLat - lat) * escala];

function aneis(g) {
  if (g.type === 'Polygon') return g.coordinates;
  if (g.type === 'MultiPolygon') return g.coordinates.flat();
  throw new Error(`Tipo de geometria inesperado: ${g.type}`);
}
function poligonos(g) {
  return g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
}
const r1 = (n) => Math.round(n * 10) / 10;

// Centro de um polígono (centroide pela área) para colocar a sigla.
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

const unidades = malha.features.map((f) => {
  const codigo = String(f.properties.codarea);
  const info = porCodigo.get(codigo);
  if (!info) throw new Error(`Código de estado desconhecido na malha: ${codigo}`);
  const polis = poligonos(f.geometry).map((p) => p.map((anel) => anel.map(projetar)));
  const caminho = polis
    .map((p) => p.map((anel) => 'M' + anel.map(([x, y]) => `${r1(x)},${r1(y)}`).join('L') + 'Z').join(''))
    .join('');
  const maior = polis.map((p) => centroide(p[0])).sort((a, b) => b.area - a.area)[0];
  return {
    codigo,
    sigla: info.sigla,
    nome: info.nome,
    regiao: info.regiao.nome,
    caminho,
    centro: [r1(maior.x), r1(maior.y)],
  };
}).sort((a, b) => a.sigla.localeCompare(b.sigla));

if (unidades.length !== 27) throw new Error(`Esperava 27 estados, vieram ${unidades.length}`);

const saida = {
  _explicacao: 'Contorno dos estados, já convertido em desenho SVG. Gerado por scripts/mapa-estados/baixar.mjs. Não edite à mão.',
  fonte: {
    nome: 'IBGE',
    publicacao: 'API de Malhas Territoriais (qualidade mínima) e API de Localidades',
    url: 'https://servicodados.ibge.gov.br/api/docs/malhas?versao=3',
    baixadoEm: new Date().toISOString().slice(0, 10),
  },
  nivel: 'estado',
  largura: LARGURA,
  altura: ALTURA,
  unidades,
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 1));
console.log(`Pronto: ${unidades.length} estados salvos em dados/geo/brasil-estados.json`);
