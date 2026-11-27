// Ferrovias do Brasil: traçado e dados de cada trecho (Ministério dos Transportes, Base Georreferenciada - Ferrovias).
// Baixa o shapefile oficial, lê o desenho (linhas) e a tabela (situação, bitola, ferrovia, concessionária, município, extensão),
// simplifica o traçado para o site e grava em GeoJSON.
// Gera: dados/infraestrutura/brasil-ferrovias.json
// Como rodar (na pasta statworld):  node scripts/ferrovias/baixar.mjs
// Precisa de: curl (já vem no Windows 10/11) e do pacote 7zip-bin (instalado com "npm install").

import { writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const sete = createRequire(import.meta.url)('7zip-bin');

// Endereço do arquivo na página "BIT - Mapas" do Ministério dos Transportes (versão de abril de 2024).
// Se o Ministério publicar outra versão, troque URL e VERSAO.
const PAGINA = 'https://www.gov.br/transportes/pt-br/assuntos/dados-de-transportes/bit/bit-mapas';
const URL_ZIP = 'https://www.gov.br/transportes/pt-br/assuntos/dados-de-transportes/bit/Base-GEO/BaseFerro.zip/@@download/file';
const VERSAO = 'abril de 2024';
const NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36'; // o gov.br recusa pedidos sem nome de navegador
const TOLERANCIA = 0.002; // graus (~200 m): simplificação do traçado; o mapa do país não precisa de mais detalhe

// ---------- baixar e abrir ----------
const pasta = join(tmpdir(), 'statworld-ferrovias');
await rm(pasta, { recursive: true, force: true });
await mkdir(pasta, { recursive: true });
const zip = join(pasta, 'BaseFerro.zip');
console.log('Baixando a base de ferrovias do Ministério dos Transportes (cerca de 10 MB)...');
execFileSync('curl', ['-s', '-f', '-L', '-m', '600', '-A', NAVEGADOR, '-o', zip, URL_ZIP]);
if (!existsSync(zip)) throw new Error('O arquivo não foi baixado. Confira o endereço em URL_ZIP (página: ' + PAGINA + ').');
if (process.platform !== 'win32') chmodSync(sete.path7za, 0o755);
execFileSync(sete.path7za, ['x', zip, `-o${pasta}`, '-y'], { stdio: 'ignore' });
const base = join(pasta, 'BaseFerro', 'BaseFerro');

// ---------- tabela (.dbf) ----------
const dbf = await readFile(base + '.dbf');
const nReg = dbf.readUInt32LE(4), tamCab = dbf.readUInt16LE(8), tamReg = dbf.readUInt16LE(10);
const campos = [];
for (let o = 32; dbf[o] !== 0x0d; o += 32) campos.push({ nome: dbf.toString('latin1', o, o + 11).replace(/\0.*$/, ''), tam: dbf[o + 16] });
const registros = [];
for (let i = 0; i < nReg; i++) {
  let p = tamCab + i * tamReg + 1; const r = {};
  for (const c of campos) { r[c.nome] = dbf.subarray(p, p + c.tam).toString('utf8').trim(); p += c.tam; } // o .cpg diz UTF-8
  registros.push(r);
}
for (const n of ['tip_situac', 'bitola', 'sigla', 'nome', 'label', 'uf', 'municipio', 'extensao']) {
  if (!campos.some((c) => c.nome === n)) throw new Error(`A tabela das ferrovias mudou: falta o campo "${n}".`);
}

// ---------- desenho (.shp, linhas) ----------
const shp = await readFile(base + '.shp');
const linhas = [];
for (let o = 100; o < shp.length; ) {
  const tamConteudo = shp.readInt32BE(o + 4) * 2; const c = o + 8;
  const tipo = shp.readInt32LE(c);
  if (tipo === 3 || tipo === 13 || tipo === 23) { // linha (com ou sem Z/M)
    const nPartes = shp.readInt32LE(c + 36), nPontos = shp.readInt32LE(c + 40);
    const partes = []; for (let k = 0; k < nPartes; k++) partes.push(shp.readInt32LE(c + 44 + 4 * k));
    const p0 = c + 44 + 4 * nPartes; const pts = [];
    for (let k = 0; k < nPontos; k++) pts.push([shp.readDoubleLE(p0 + 16 * k), shp.readDoubleLE(p0 + 16 * k + 8)]);
    linhas.push(partes.map((ini, k) => pts.slice(ini, partes[k + 1] ?? nPontos)));
  } else linhas.push(null); // registro vazio
  o = c + tamConteudo;
}
if (linhas.length !== registros.length) throw new Error(`Desenho (${linhas.length}) e tabela (${registros.length}) não batem.`);

// Simplificação (Douglas-Peucker) e arredondamento.
function simplificar(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)]; let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const d = dx || dy ? Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / Math.hypot(dx, dy) : Math.hypot(x - a[0], y - a[1]);
    if (d > max) { max = d; idx = i; }
  }
  return max > tol ? [...simplificar(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplificar(pts.slice(idx), tol)] : [a, b];
}
const r4 = (n) => Math.round(n * 1e4) / 1e4;

const SITUACAO = { 'Em Operação': 'operacao', Desativada: 'desativada', 'Em Obra': 'obra', Planejada: 'planejada', Estudo: 'estudo' };
const features = [];
let pontosAntes = 0, pontosDepois = 0;
registros.forEach((r, i) => {
  if (!linhas[i]) return;
  const partes = linhas[i].map((p) => { pontosAntes += p.length; const s = simplificar(p, TOLERANCIA).map(([x, y]) => [r4(x), r4(y)]); pontosDepois += s.length; return s; });
  features.push({
    type: 'Feature',
    properties: {
      situacao: SITUACAO[r.tip_situac] ?? (r.tip_situac || null),
      bitola: r.bitola || null,
      ferrovia: r.sigla && r.sigla !== 'Sem Info' ? r.sigla : null, // número da ferrovia no Sistema Nacional de Viação (EF-xxx)
      concessao: r.label || null, // sigla da concessão ou do projeto (RMS, MRS, FICO, FERROGRÃO...)
      concessaoNome: r.nome || null,
      uf: r.uf || null,
      municipio: r.municipio || null,
      km: r.extensao ? Math.round(Number(r.extensao) * 100) / 100 : null,
    },
    geometry: partes.length === 1 ? { type: 'LineString', coordinates: partes[0] } : { type: 'MultiLineString', coordinates: partes },
  });
});

// Resumo por situação e por concessão (km), para conferir com os números oficiais.
const resumo = {};
for (const f of features) {
  const k = f.properties.situacao ?? 'sem informação';
  resumo[k] = Math.round(((resumo[k] ?? 0) + (f.properties.km ?? 0)) * 10) / 10;
}
const porConcessao = {};
for (const f of features.filter((f) => f.properties.situacao === 'operacao')) {
  const k = f.properties.concessao ?? 'sem concessão';
  porConcessao[k] = Math.round(((porConcessao[k] ?? 0) + (f.properties.km ?? 0)) * 10) / 10;
}

const saida = {
  _explicacao: 'Ferrovias do Brasil, trecho por trecho (GeoJSON, coordenadas em graus, SIRGAS 2000). Gerado por scripts/ferrovias/baixar.mjs. Não edite à mão. situacao: operacao, desativada, obra, planejada, estudo. A base NÃO diz se o trecho leva carga ou passageiros.',
  fonte: { nome: 'Ministério dos Transportes', publicacao: `Base Georreferenciada - Ferrovias (${VERSAO})`, url: PAGINA, arquivo: URL_ZIP, baixadoEm: new Date().toISOString().slice(0, 10) },
  simplificacao: `Traçado simplificado (tolerância de ${TOLERANCIA} grau, cerca de 200 m): ${pontosAntes} pontos viraram ${pontosDepois}.`,
  resumoKmPorSituacao: resumo,
  resumoKmEmOperacaoPorConcessao: porConcessao,
  type: 'FeatureCollection',
  features,
};
const dir = new URL('../../dados/infraestrutura/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('brasil-ferrovias.json', dir), JSON.stringify(saida));
await rm(pasta, { recursive: true, force: true });
console.log(`Pronto: ${features.length} trechos; ${pontosAntes} pontos → ${pontosDepois}. Km por situação: ${JSON.stringify(resumo)}`);
