// Estados Unidos: Preços.
//  1. Inflação em 12 meses (CPI-U, índice de preços ao consumidor, BLS, sem ajuste sazonal), mês a mês desde 2019,
//     com a meta de longo prazo do Fed (2%, medida pelo índice PCE; o Fed não tem intervalo de tolerância).
//  2. Custo de vida por estado: Regional Price Parities (BEA, arquivo SARPP; EUA = 100), último ano publicado.
// Gera: dados/precos/eua-ipca.json (mesmo formato da inflação do Brasil) e dados/precos/eua-estados.json
// Como rodar (na pasta statworld):  node scripts/eua-precos/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx');

// ---- Meta do Fed (conferida em https://www.federalreserve.gov/faqs/economy_14400.htm, 23 nov 2026) ----
const META_FED = { meta: 2, indice: 'PCE', url: 'https://www.federalreserve.gov/faqs/economy_14400.htm' };
const INICIO = 2019;
// -------------------------------------------------------------------------------------------------

const SIGLAS = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY',
};
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const hoje = new Date().toLocaleDateString('sv-SE');

// ---------- 1. CPI em 12 meses ----------
const anoFim = new Date().getFullYear();
const r = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ seriesid: ['CUUR0000SA0'], startyear: String(INICIO - 1), endyear: String(anoFim) }),
});
const j = await r.json();
if (j.status !== 'REQUEST_SUCCEEDED') throw new Error(`O BLS não respondeu: ${(j.message ?? []).join(' ')}`);
const indice = Object.fromEntries(j.Results.series[0].data.filter((d) => /^M(0[1-9]|1[0-2])$/.test(d.period)).map((d) => [`${d.year}-${d.period.slice(1)}`, Number(d.value)]));
const meses = Object.keys(indice).sort().filter((k) => Number(k.slice(0, 4)) >= INICIO);
const pontos = meses.map((k) => {
  const ant = `${Number(k.slice(0, 4)) - 1}-${k.slice(5)}`;
  const v = Number.isFinite(indice[k]) && Number.isFinite(indice[ant]) ? Math.round((indice[k] / indice[ant] - 1) * 10000) / 100 : null;
  return { periodo: k.replace('-', ''), nome: `${MESES[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}`, valor: v, meta: META_FED.meta, min: META_FED.meta, max: META_FED.meta };
});
// Último mês COM valor. (Ex.: o BLS não coletou o CPI de outubro de 2025, por causa da paralisação do governo;
// por isso a inflação em 12 meses de outubro de 2025 e de outubro de 2026 fica "sem dado".)
const fim = [...pontos].reverse().find((p) => p.valor != null);
const ultimoMes = `${fim.periodo.slice(0, 4)}-${fim.periodo.slice(4)}`;
const semDado = pontos.filter((p) => p.valor == null).map((p) => p.nome);
const ipca = {
  _explicacao: 'EUA: inflação em 12 meses (CPI-U, BLS) com a meta de longo prazo do Fed (2%, medida pelo PCE, sem intervalo de tolerância). Gerado por scripts/eua-precos/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje,
  periodo: `${MESES[Number(ultimoMes.slice(5)) - 1]} de ${ultimoMes.slice(0, 4)}`,
  ultimo: { valor: fim.valor, meta: fim.meta, min: fim.min, max: fim.max },
  serie: {
    nome: 'Inflação em 12 meses (CPI-U), %', unidade: '%', frequencia: 'mensal',
    observacao: semDado.length ? `Sem dado em: ${semDado.join(', ')} (o BLS não coletou o CPI de outubro de 2025, durante a paralisação do governo).` : undefined,
    fontes: [
      { nome: 'BLS (EUA)', publicacao: 'Consumer Price Index, todos os consumidores urbanos (série CUUR0000SA0)', url: 'https://www.bls.gov/cpi/', dataConsulta: hoje },
      { nome: 'Federal Reserve (EUA)', publicacao: 'Meta de inflação de longo prazo: 2%, medida pelo índice PCE', url: META_FED.url },
    ],
    pontos,
  },
};

// ---------- 2. Custo de vida por estado (RPP) ----------
const rz = await fetch('https://apps.bea.gov/regional/zip/SARPP.zip');
if (!rz.ok) throw new Error(`O BEA respondeu com erro ${rz.status}`);
const atualBea = rz.headers.get('last-modified');
const zip = XLSX.CFB.read(Buffer.from(await rz.arrayBuffer()), { type: 'buffer' });
const arq = zip.FileIndex.find((f) => /^SARPP_STATE_\d{4}_\d{4}\.csv$/.test(f.name));
if (!arq) throw new Error('Não achei a tabela SARPP no arquivo do BEA.');
const linhas = Buffer.from(arq.content).toString('latin1').split(/\r?\n/);
const anoRpp = linhas[0].split(',').at(-1).trim();
const porLinha = { 1: {}, 2: {}, 4: {} }; // 1 = tudo, 2 = bens, 4 = moradia
for (const l of linhas.slice(1)) {
  const m = l.match(/^\s*"(\d{2})000",.*?,SARPP,(\d+),/);
  if (!m || !porLinha[m[2]] || !SIGLAS[m[1]]) continue;
  const v = Number(l.split(',').at(-1).trim());
  porLinha[m[2]][SIGLAS[m[1]]] = Number.isFinite(v) ? v : null;
}
const fonteRpp = { nome: 'BEA (EUA)', publicacao: `Regional Price Parities, tabela SARPP, ${anoRpp}`, url: 'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area', dataAtualizacao: atualBea ? new Date(atualBea).toISOString().slice(0, 10) : null };
const ind = (nome, valores, calculo) => ({ nome, unidade: 'indice', periodo: anoRpp, frequencia: 'anual', fontes: [fonteRpp], calculo, valorPais: 100, valores });
const estados = {
  _explicacao: 'EUA: custo de vida de cada estado (Regional Price Parities, BEA; EUA = 100). Gerado por scripts/eua-precos/baixar.mjs. Não edite à mão.',
  pais: 'US', nivel: 'estado', periodo: anoRpp, baixadoEm: hoje,
  indicadores: {
    'custo-vida': ind('Custo de vida (EUA = 100)', porLinha[1], 'Valor publicado pelo BEA: quanto os preços de tudo o que se consome no estado ficam acima (mais de 100) ou abaixo (menos de 100) da média do país.'),
    'custo-bens': ind('Preço dos bens (EUA = 100)', porLinha[2], 'Valor publicado pelo BEA: só os bens (comida, roupas, carros…), em relação à média do país.'),
    'custo-moradia': ind('Preço da moradia (EUA = 100)', porLinha[4], 'Valor publicado pelo BEA: aluguel e moradia, em relação à média do país.'),
  },
};

await mkdir(new URL('../../dados/precos/', import.meta.url), { recursive: true });
await writeFile(new URL('../../dados/precos/eua-ipca.json', import.meta.url), JSON.stringify(ipca, null, 2));
await writeFile(new URL('../../dados/precos/eua-estados.json', import.meta.url), JSON.stringify(estados, null, 2));
console.log(`Inflação (CPI) em 12 meses, ${ipca.periodo}: ${fim.valor}% (meta do Fed: ${META_FED.meta}%, pelo PCE).`);
const ord = Object.entries(porLinha[1]).sort((a, b) => b[1] - a[1]);
console.log(`Custo de vida ${anoRpp}: mais caro ${ord[0].join(' ')}, mais barato ${ord.at(-1).join(' ')}.`);
