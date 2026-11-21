// Baixa o contorno dos estados dos EUA e transforma em desenho (SVG) no mesmo formato do mapa do Brasil.
// O Alasca e o Havaí já vêm reposicionados em quadros ao lado (projeção "Albers USA").
// Gera: dados/geo/eua-estados.json
// Como rodar (na pasta statworld):  node scripts/eua-mapa-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { feature } from 'topojson-client';

// us-atlas: contornos do Census Bureau (Cartographic Boundary Files), já projetados.
const VERSAO = '3.0.1';
const URL_MALHA = `https://cdn.jsdelivr.net/npm/us-atlas@${VERSAO}/states-albers-10m.json`;
const SAIDA = new URL('../../dados/geo/eua-estados.json', import.meta.url);

// Código FIPS -> sigla, nome em português e região do Census Bureau.
// Regiões: https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf
const ESTADOS = {
  '01': ['AL', 'Alabama', 'Sul'], '02': ['AK', 'Alasca', 'Oeste'], '04': ['AZ', 'Arizona', 'Oeste'],
  '05': ['AR', 'Arkansas', 'Sul'], '06': ['CA', 'Califórnia', 'Oeste'], '08': ['CO', 'Colorado', 'Oeste'],
  '09': ['CT', 'Connecticut', 'Nordeste'], '10': ['DE', 'Delaware', 'Sul'], '11': ['DC', 'Distrito de Colúmbia', 'Sul'],
  '12': ['FL', 'Flórida', 'Sul'], '13': ['GA', 'Geórgia', 'Sul'], '15': ['HI', 'Havaí', 'Oeste'],
  '16': ['ID', 'Idaho', 'Oeste'], '17': ['IL', 'Illinois', 'Meio-Oeste'], '18': ['IN', 'Indiana', 'Meio-Oeste'],
  '19': ['IA', 'Iowa', 'Meio-Oeste'], '20': ['KS', 'Kansas', 'Meio-Oeste'], '21': ['KY', 'Kentucky', 'Sul'],
  '22': ['LA', 'Luisiana', 'Sul'], '23': ['ME', 'Maine', 'Nordeste'], '24': ['MD', 'Maryland', 'Sul'],
  '25': ['MA', 'Massachusetts', 'Nordeste'], '26': ['MI', 'Michigan', 'Meio-Oeste'], '27': ['MN', 'Minnesota', 'Meio-Oeste'],
  '28': ['MS', 'Mississippi', 'Sul'], '29': ['MO', 'Missouri', 'Meio-Oeste'], '30': ['MT', 'Montana', 'Oeste'],
  '31': ['NE', 'Nebraska', 'Meio-Oeste'], '32': ['NV', 'Nevada', 'Oeste'], '33': ['NH', 'Nova Hampshire', 'Nordeste'],
  '34': ['NJ', 'Nova Jersey', 'Nordeste'], '35': ['NM', 'Novo México', 'Oeste'], '36': ['NY', 'Nova York', 'Nordeste'],
  '37': ['NC', 'Carolina do Norte', 'Sul'], '38': ['ND', 'Dakota do Norte', 'Meio-Oeste'], '39': ['OH', 'Ohio', 'Meio-Oeste'],
  '40': ['OK', 'Oklahoma', 'Sul'], '41': ['OR', 'Oregon', 'Oeste'], '42': ['PA', 'Pensilvânia', 'Nordeste'],
  '44': ['RI', 'Rhode Island', 'Nordeste'], '45': ['SC', 'Carolina do Sul', 'Sul'], '46': ['SD', 'Dakota do Sul', 'Meio-Oeste'],
  '47': ['TN', 'Tennessee', 'Sul'], '48': ['TX', 'Texas', 'Sul'], '49': ['UT', 'Utah', 'Oeste'],
  '50': ['VT', 'Vermont', 'Nordeste'], '51': ['VA', 'Virgínia', 'Sul'], '53': ['WA', 'Washington', 'Oeste'],
  '54': ['WV', 'Virgínia Ocidental', 'Sul'], '55': ['WI', 'Wisconsin', 'Meio-Oeste'], '56': ['WY', 'Wyoming', 'Oeste'],
};

const r = await fetch(URL_MALHA);
if (!r.ok) throw new Error(`Não consegui baixar o mapa (${r.status}) em ${URL_MALHA}`);
const topo = await r.json();
const [, , largura, altura] = topo.bbox ?? [0, 0, 975, 610];
const geo = feature(topo, topo.objects.states);

const r1 = (n) => Math.round(n * 10) / 10;
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

const unidades = geo.features
  .filter((f) => ESTADOS[f.id]) // fica só com os 50 estados + DC
  .map((f) => {
    const [sigla, nome, regiao] = ESTADOS[f.id];
    const polis = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const caminho = polis.map((p) => p.map((anel) => 'M' + anel.map(([x, y]) => `${r1(x)},${r1(y)}`).join('L') + 'Z').join('')).join('');
    const maior = polis.map((p) => centroide(p[0])).sort((a, b) => b.area - a.area)[0];
    return { codigo: f.id, sigla, nome, regiao, caminho, centro: [r1(maior.x), r1(maior.y)] };
  })
  .sort((a, b) => a.sigla.localeCompare(b.sigla));

if (unidades.length !== 51) throw new Error(`Esperava 51 (50 estados + DC), vieram ${unidades.length}`);

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Contorno dos estados dos EUA, já convertido em desenho SVG. Gerado por scripts/eua-mapa-estados/baixar.mjs. Não edite à mão.',
  fonte: {
    nome: 'U.S. Census Bureau',
    publicacao: `Cartographic Boundary Files, via us-atlas ${VERSAO} (projeção Albers USA)`,
    url: 'https://github.com/topojson/us-atlas',
    baixadoEm: new Date().toISOString().slice(0, 10),
  },
  nivel: 'estado',
  largura: Math.round(largura),
  altura: Math.round(altura),
  unidades,
}, null, 1));
console.log(`Pronto: ${unidades.length} estados salvos em dados/geo/eua-estados.json`);
