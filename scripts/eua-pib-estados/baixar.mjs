// Baixa do BEA (Bureau of Economic Analysis, EUA) o PIB por estado e a população,
// e calcula as mesmas três medidas do mapa do Brasil.
// Gera: dados/economia/eua-estados.json
// Como rodar (na pasta statworld):  node scripts/eua-pib-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx'); // usado aqui só para abrir o .zip

// ---- O que muda a cada ano (confira no LEIA-ME) ----------------------------
const ANO = 2025;
// ----------------------------------------------------------------------------

const URL_PIB = 'https://apps.bea.gov/regional/zip/SAGDP.zip';
const URL_RENDA = 'https://apps.bea.gov/regional/zip/SAINC.zip';
const SAIDA = new URL('../../dados/economia/eua-estados.json', import.meta.url);

// FIPS do estado -> sigla (50 estados + DC).
const SIGLAS = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY',
};

async function baixarZip(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O BEA respondeu com erro ${r.status} em ${url}`);
  return XLSX.CFB.read(Buffer.from(await r.arrayBuffer()), { type: 'buffer' });
}

// Lê uma linha de CSV respeitando aspas.
function campos(linha) {
  const out = []; let atual = ''; let aspas = false;
  for (const c of linha) {
    if (c === '"') aspas = !aspas;
    else if (c === ',' && !aspas) { out.push(atual); atual = ''; }
    else atual += c;
  }
  out.push(atual);
  return out.map((s) => s.trim());
}

// Abre a tabela "<NOME>__ALL_AREAS_*.csv" do zip e devolve { valores por estado e linha, data de atualização }.
function lerTabela(zip, nome) {
  const arq = zip.FileIndex.find((f) => f.name.startsWith(`${nome}__ALL_AREAS`) && f.name.endsWith('.csv'));
  if (!arq) throw new Error(`Não achei a tabela ${nome} no arquivo do BEA`);
  const linhas = Buffer.from(arq.content).toString('latin1').split(/\r?\n/);
  const cab = campos(linhas[0]);
  const col = cab.indexOf(String(ANO));
  if (col < 0) throw new Error(`A tabela ${nome} não tem o ano ${ANO}`);
  const dados = {}; // dados[sigla][linha] = valor
  for (const l of linhas.slice(1)) {
    const c = campos(l);
    const fips = c[0]?.slice(0, 2);
    if (!c[0] || c[0].slice(2) !== '000' || !SIGLAS[fips]) continue;
    const v = Number(c[col]);
    // "(NA)", "(D)" e parecidos = sem dado (nunca zero).
    (dados[SIGLAS[fips]] ??= {})[c[4]] = Number.isFinite(v) && c[col] !== '' ? v : null;
  }
  const atualizado = linhas.find((l) => l.includes('Last updated:'))?.match(/Last updated: ([A-Za-z]+ \d+, \d{4})/)?.[1];
  const anterior = {};
  const colAnt = cab.indexOf(String(ANO - 1));
  for (const l of linhas.slice(1)) {
    const c = campos(l);
    const fips = c[0]?.slice(0, 2);
    if (!c[0] || c[0].slice(2) !== '000' || !SIGLAS[fips]) continue;
    const v = Number(c[colAnt]);
    (anterior[SIGLAS[fips]] ??= {})[c[4]] = Number.isFinite(v) && c[colAnt] !== '' ? v : null;
  }
  // Total do país (FIPS 00000)
  const eua = campos(linhas.find((l) => campos(l)[0] === '00000' && campos(l)[4] === '3') ?? '');
  return { dados, anterior, atualizado, totalPais: Number(eua[col]) };
}

const [zipPib, zipRenda] = await Promise.all([baixarZip(URL_PIB), baixarZip(URL_RENDA)]);
const pib = lerTabela(zipPib, 'SAGDP1'); // linha 2 = índice de volume; linha 3 = PIB em dólares correntes (milhões)
const renda = lerTabela(zipRenda, 'SAINC1'); // linha 2 = população

const siglas = Object.values(SIGLAS).sort();
for (const s of siglas) if (!pib.dados[s] || !renda.dados[s]) throw new Error(`Faltou o estado ${s} nas tabelas do BEA`);
if (!pib.atualizado) throw new Error('Não achei a data de atualização do BEA');
const dataDivulgacao = new Date(pib.atualizado + ' 12:00 UTC').toISOString().slice(0, 10);

const arred = (v, casas) => (v === null || !Number.isFinite(v) ? null : Math.round(v * 10 ** casas) / 10 ** casas);
const valores = (fn) => Object.fromEntries(siglas.map((s) => [s, fn(s)]));
const somaEstados = siglas.reduce((t, s) => t + (pib.dados[s]['3'] ?? 0), 0);

const fonteBEA = {
  nome: 'BEA (EUA)',
  publicacao: `GDP by State ${ANO} (tabela SAGDP1)`,
  url: 'https://apps.bea.gov/regional/downloadzip.htm',
  dataDivulgacao,
};
const fontePop = {
  nome: 'BEA (EUA)',
  publicacao: `População por estado ${ANO} (tabela SAINC1)`,
  url: 'https://apps.bea.gov/regional/downloadzip.htm',
};

const saida = {
  _explicacao: 'Medidas de economia por estado dos EUA. Gerado por scripts/eua-pib-estados/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'US',
  nivel: 'estado',
  periodo: String(ANO),
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: {
    'peso-pib': {
      nome: 'Participação no PIB dos EUA',
      unidade: '%',
      periodo: String(ANO),
      fontes: [fonteBEA],
      calculo: 'Cálculo do StatWorld: PIB do estado em dólares correntes dividido pela soma dos 50 estados e do Distrito de Colúmbia.',
      valores: valores((s) => (pib.dados[s]['3'] === null ? null : arred((pib.dados[s]['3'] / somaEstados) * 100, 4))),
    },
    'pib-por-pessoa': {
      nome: 'PIB por pessoa',
      unidade: 'moeda',
      periodo: String(ANO),
      fontes: [fonteBEA, fontePop],
      calculo: 'Cálculo do StatWorld: PIB do estado em dólares correntes dividido pela população estimada pelo BEA para o mesmo ano.',
      valores: valores((s) => {
        const g = pib.dados[s]['3'], p = renda.dados[s]['2'];
        return g === null || !p ? null : arred((g * 1e6) / p, 0);
      }),
    },
    crescimento: {
      nome: `Crescimento real do PIB em ${ANO}`,
      unidade: '%',
      periodo: String(ANO),
      fontes: [fonteBEA],
      calculo: `Variação do índice de volume do PIB real (linha 2 da tabela SAGDP1) de ${ANO - 1} para ${ANO}, descontada a inflação.`,
      valores: valores((s) => {
        const a = pib.dados[s]['2'], b = pib.anterior[s]['2'];
        return a === null || b === null ? null : arred((a / b - 1) * 100, 4);
      }),
    },
  },
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 2));
const semDado = Object.values(saida.indicadores).flatMap((i) => Object.values(i.valores)).filter((v) => v === null).length;
console.log(`Pronto: ${siglas.length} estados (${ANO}, BEA atualizado em ${dataDivulgacao}) salvos em dados/economia/eua-estados.json`);
console.log(`Conferência: soma dos estados = US$ ${(somaEstados / 1e6).toFixed(2)} tri; total do país no BEA = US$ ${(pib.totalPais / 1e6).toFixed(2)} tri`);
console.log(semDado ? `Atenção: ${semDado} valores ficaram como "sem dado".` : 'Nenhum valor ficou sem dado.');
