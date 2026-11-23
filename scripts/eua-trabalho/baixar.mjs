// Estados Unidos: Trabalho e renda.
//  - BLS (Bureau of Labor Statistics), API pública v1 (sem chave; limite de 25 consultas por dia):
//      desemprego de cada estado (LAUS, mensal, com ajuste sazonal), empregos criados no mês em cada estado
//      (folha de pagamento, CES estadual) e, para o país, desemprego e salário médio por hora mês a mês desde 2012;
//  - BEA, arquivo SAINC (sem chave): renda pessoal por pessoa de cada estado (anual).
// Gera: dados/trabalho/eua-estados.json, dados/trabalho/eua-series.json
// Como rodar (na pasta statworld):  node scripts/eua-trabalho/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx');

const SIGLAS = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY',
};
const fipsLista = Object.keys(SIGLAS);
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const hoje = new Date().toLocaleDateString('sv-SE');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Consulta ao BLS (até 25 séries por vez; até 10 anos por vez).
async function bls(series, anoIni, anoFim) {
  const corpo = { seriesid: series };
  if (anoIni) Object.assign(corpo, { startyear: String(anoIni), endyear: String(anoFim) });
  for (let t = 1; t <= 4; t++) {
    const r = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
    const j = r.ok ? await r.json() : null;
    if (j?.status === 'REQUEST_SUCCEEDED') return Object.fromEntries(j.Results.series.map((s) => [s.seriesID, s.data.filter((d) => /^M\d\d$/.test(d.period) && d.period !== 'M13')]));
    if (j?.message?.some((m) => /threshold|limit/i.test(m))) throw new Error(`O BLS recusou: limite diário de consultas (${j.message.join(' ')})`);
    await espera(3000 * t);
  }
  throw new Error('O BLS não respondeu.');
}
const emLotes = async (series, ...a) => { const out = {}; for (let i = 0; i < series.length; i += 25) { Object.assign(out, await bls(series.slice(i, i + 25), ...a)); await espera(1000); } return out; };
const chave = (d) => `${d.year}-${d.period.slice(1)}`;
const num = (v) => (v == null || v === '-' || isNaN(Number(v)) ? null : Number(v));

// ---------- Por estado: último mês ----------
const idDes = (f) => `LASST${f}0000000000003`; // taxa de desemprego, com ajuste sazonal
const idEmp = (f) => `SMS${f}000000000000001`; // empregos na folha de pagamento, total não agrícola (milhares)
const des = await emLotes(fipsLista.map(idDes));
const emp = await emLotes(fipsLista.map(idEmp));
const mesDes = fipsLista.map((f) => des[idDes(f)]?.[0]).filter(Boolean).map(chave).sort().at(-1);
const mesEmp = fipsLista.map((f) => emp[idEmp(f)]?.[0]).filter(Boolean).map(chave).sort().at(-1);
const valorEm = (lista, k) => num(lista?.find((d) => chave(d) === k)?.value);
const mesAnterior = (k) => { const [a, m] = k.split('-').map(Number); return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`; };
const desemprego = Object.fromEntries(fipsLista.map((f) => [SIGLAS[f], valorEm(des[idDes(f)], mesDes)]));
const empregos = Object.fromEntries(fipsLista.map((f) => {
  const a = valorEm(emp[idEmp(f)], mesEmp), b = valorEm(emp[idEmp(f)], mesAnterior(mesEmp));
  return [SIGLAS[f], a == null || b == null ? null : Math.round((a - b) * 1000)];
}));
const nacional = await bls(['LNS14000000', 'CES0000000001']);
const desPais = valorEm(nacional.LNS14000000, mesDes);
const empPais = (() => { const a = valorEm(nacional.CES0000000001, mesEmp), b = valorEm(nacional.CES0000000001, mesAnterior(mesEmp)); return a == null || b == null ? null : Math.round((a - b) * 1000); })();
const nomeMes = (k) => `${MESES[Number(k.slice(5)) - 1]} de ${k.slice(0, 4)}`;

// ---------- Renda por pessoa (BEA, SAINC1) ----------
const rz = await fetch('https://apps.bea.gov/regional/zip/SAINC.zip');
if (!rz.ok) throw new Error(`O BEA respondeu com erro ${rz.status}`);
const atualBea = rz.headers.get('last-modified');
const zip = XLSX.CFB.read(Buffer.from(await rz.arrayBuffer()), { type: 'buffer' });
const sainc1 = zip.FileIndex.find((f) => /^SAINC1__ALL_AREAS/.test(f.name));
const linhas = Buffer.from(sainc1.content).toString('latin1').split(/\r?\n/);
const cab = linhas[0].split(',');
const anoRenda = cab.at(-1).trim();
const renda = {}; let rendaPais = null;
for (const l of linhas.slice(1)) {
  const m = l.match(/^\s*"(\d{5})",.*?,SAINC1,3,/);
  if (!m) continue;
  const v = num(l.split(',').at(-1).trim());
  if (m[1] === '00000') rendaPais = v;
  else if (SIGLAS[m[1].slice(0, 2)] && m[1].endsWith('000')) renda[SIGLAS[m[1].slice(0, 2)]] = v;
}

const fonteBls = (pub, url) => ({ nome: 'BLS (EUA)', publicacao: pub, url, dataConsulta: hoje });
const estados = {
  _explicacao: 'EUA: desemprego (BLS, mensal), empregos criados no mês (BLS) e renda por pessoa (BEA, anual) por estado. Gerado por scripts/eua-trabalho/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'US', nivel: 'estado', periodo: nomeMes(mesDes), baixadoEm: hoje,
  indicadores: {
    desemprego: {
      nome: 'Taxa de desemprego', unidade: '%', periodo: nomeMes(mesDes), frequencia: 'mensal',
      fontes: [fonteBls(`Local Area Unemployment Statistics, ${nomeMes(mesDes)}, com ajuste sazonal`, 'https://www.bls.gov/lau/')],
      calculo: 'Valor publicado pelo BLS: parte das pessoas na força de trabalho que procuraram emprego e não encontraram, com ajuste sazonal. O mês mais recente é preliminar e pode ser revisado.',
      valorPais: desPais, valores: desemprego,
    },
    renda: {
      nome: 'Renda pessoal por pessoa, por ano', unidade: 'moeda', periodo: anoRenda, frequencia: 'anual',
      fontes: [{ nome: 'BEA (EUA)', publicacao: `Personal Income by State, tabela SAINC1, ${anoRenda}`, url: 'https://apps.bea.gov/regional/downloadzip.htm', dataAtualizacao: atualBea ? new Date(atualBea).toISOString().slice(0, 10) : null }],
      calculo: 'Valor publicado pelo BEA: toda a renda das pessoas do estado (salários, aluguéis, juros, aposentadorias e benefícios) dividida pela população. Não é igual à renda média do trabalho do Brasil.',
      valorPais: rendaPais, valores: renda,
    },
    empregos: {
      nome: 'Empregos criados no mês (folha de pagamento)', unidade: 'pessoas', periodo: nomeMes(mesEmp), frequencia: 'mensal',
      fontes: [fonteBls(`Current Employment Statistics (estados), ${nomeMes(mesEmp)}`, 'https://www.bls.gov/sae/')],
      calculo: 'Cálculo do StatWorld com números do BLS: empregos na folha de pagamento (total, sem a agropecuária) no mês menos no mês anterior. O mês mais recente é preliminar.',
      valorPais: empPais, valores: empregos,
    },
  },
};

// ---------- País, mês a mês desde 2012 ----------
const anoAtual = Number(mesDes.slice(0, 4));
const serieNac = {};
for (const [ini, fim] of [[2012, 2021], [2022, anoAtual]]) {
  const r = await bls(['LNS14000000', 'CES0500000003'], ini, fim);
  for (const [id, dados] of Object.entries(r)) (serieNac[id] = serieNac[id] ?? []).push(...dados);
  await espera(1000);
}
const pontos = (id) => serieNac[id].map((d) => ({ k: chave(d), v: num(d.value) })).sort((a, b) => a.k.localeCompare(b.k))
  .map((p) => ({ periodo: p.k.replace('-', ''), nome: `${MES_CURTO[Number(p.k.slice(5)) - 1]} ${p.k.slice(0, 4)}`, valor: p.v }));
const series = {
  _explicacao: 'EUA: desemprego e salário médio por hora, mês a mês (BLS). Gerado por scripts/eua-trabalho/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje,
  series: {
    desemprego: { nome: 'Taxa de desemprego, %', unidade: '%', frequencia: 'mensal', fontes: [fonteBls('Current Population Survey, taxa de desemprego com ajuste sazonal (série LNS14000000)', 'https://www.bls.gov/cps/')], pontos: pontos('LNS14000000') },
    renda: { nome: 'Salário médio por hora, setor privado, US$', unidade: 'moeda', frequencia: 'mensal', observacao: 'Valores correntes (sem descontar a inflação).', fontes: [fonteBls('Current Employment Statistics, salário médio por hora no setor privado (série CES0500000003)', 'https://www.bls.gov/ces/')], pontos: pontos('CES0500000003') },
  },
};

await mkdir(new URL('../../dados/trabalho/', import.meta.url), { recursive: true });
await writeFile(new URL('../../dados/trabalho/eua-estados.json', import.meta.url), JSON.stringify(estados, null, 2));
await writeFile(new URL('../../dados/trabalho/eua-series.json', import.meta.url), JSON.stringify(series, null, 2));
const semDado = [desemprego, renda, empregos].flatMap((o) => Object.values(o)).filter((v) => v == null).length;
console.log(`Desemprego (${nomeMes(mesDes)}): EUA ${desPais}%. Empregos criados (${nomeMes(mesEmp)}): ${empPais}. Renda por pessoa (${anoRenda}): US$ ${rendaPais}.`);
console.log(`Séries: ${series.series.desemprego.pontos.length} meses de desemprego, ${series.series.renda.pontos.length} de salário. ${semDado ? semDado + ' valores sem dado.' : 'Nenhum valor sem dado.'}`);
