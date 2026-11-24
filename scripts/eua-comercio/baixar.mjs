// Estados Unidos: Comércio exterior, com a API do Census (US Census Bureau, International Trade).
// Precisa de uma chave gratuita: variável CENSUS_API_KEY (no computador, no arquivo .env, que não vai para o GitHub;
// na rotina automática, no "segredo" CENSUS_API_KEY do GitHub).
//  1. Exportações de cada estado no último ano completo (mapa, ranking, ficha);
//  2. 10 principais produtos (classificação internacional HS/SH, 4 dígitos) e 10 principais países compradores;
//  3. Balança comercial do ano em curso (janeiro até o último mês publicado) e o mesmo período do ano anterior.
// Os nomes em português de produtos e países vêm do Comex Stat (Brasil), que usa a mesma classificação de produtos.
// Gera: dados/comercio/eua-estados.json, eua-listas.json, eua-balanca.json
// Como rodar (na pasta statworld):  node scripts/eua-comercio/baixar.mjs

import { writeFile, mkdir, readFile } from 'node:fs/promises';

// Chave: variável de ambiente ou arquivo .env (nunca escrita no código).
let CHAVE = process.env.CENSUS_API_KEY;
if (!CHAVE) {
  try { CHAVE = (await readFile(new URL('../../.env', import.meta.url), 'utf8')).match(/^CENSUS_API_KEY=(.+)$/m)?.[1]?.trim(); } catch {}
}
if (!CHAVE) throw new Error('Falta a chave do Census (CENSUS_API_KEY). Veja o LEIA-ME.');

const API = 'https://api.census.gov/data/timeseries/intltrade';
const COMEX = 'https://api-comexstat.mdic.gov.br';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const hoje = new Date().toLocaleDateString('sv-SE');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const SIGLAS = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].sort();

async function census(caminho) {
  for (let t = 1; t <= 4; t++) {
    const r = await fetch(`${API}/${caminho}&key=${CHAVE}`, { redirect: 'manual' });
    if (r.status === 302) throw new Error('O Census recusou a chave (inválida ou não ativada).');
    if (r.status === 204) return null; // período ainda sem dado
    if (r.ok) { const j = await r.json(); const [cab, ...linhas] = j; return linhas.map((l) => Object.fromEntries(cab.map((c, i) => [c, l[i]]))); }
    await espera(2000 * t);
  }
  throw new Error(`O Census não respondeu: ${caminho}`);
}
async function comex(caminho, corpo) {
  for (let t = 1; t <= 4; t++) {
    const r = await fetch(`${COMEX}/${caminho}`, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : {});
    if (r.ok) { const j = await r.json(); if (j.data) return j.data.list ?? j.data; }
    await espera(3000 * t);
  }
  throw new Error(`O Comex Stat não respondeu: ${caminho}`);
}

// Último mês publicado e último ano completo.
let ultimo = null;
for (let d = new Date(); !ultimo; d.setMonth(d.getMonth() - 1)) {
  const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (await census(`exports/hs?get=ALL_VAL_YR&time=${k}`)) ultimo = k;
}
const anoAtual = Number(ultimo.slice(0, 4)), mesAtual = Number(ultimo.slice(5));
const anoFechado = mesAtual === 12 ? anoAtual : anoAtual - 1;
const dez = `${anoFechado}-12`;

// ---------- 1. Exportações por estado ----------
const porEstado = await census(`exports/statehs?get=STATE,ALL_VAL_YR&time=${dez}`);
const totalAno = Number((await census(`exports/hs?get=ALL_VAL_YR&time=${dez}`))[0].ALL_VAL_YR);
const valores = Object.fromEntries(SIGLAS.map((s) => [s, null]));
for (const l of porEstado) if (l.STATE in valores) valores[l.STATE] = Number(l.ALL_VAL_YR);
const fonte = (pub) => ({ nome: 'Census (EUA)', publicacao: pub, url: 'https://www.census.gov/foreign-trade/', dataConsulta: hoje });
const pubAno = `International Trade, exportações de ${anoFechado}`;
const estados = {
  _explicacao: 'EUA: exportações de cada estado (US$) no último ano completo. Gerado por scripts/eua-comercio/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'US', nivel: 'estado', periodo: String(anoFechado), baixadoEm: hoje,
  indicadores: {
    exportacoes: {
      nome: `Exportações em ${anoFechado}`, unidade: 'moeda-usd', periodo: String(anoFechado), frequencia: 'anual',
      fontes: [fonte(pubAno)],
      calculo: 'Valor publicado pelo Census: exportações pelo estado de origem do embarque (US$, valor "free alongside ship"). O total do país inclui exportações sem estado identificado, Porto Rico e outros territórios.',
      valorPais: totalAno, valores,
    },
    'parte-exportacoes': {
      nome: 'Parte das exportações do país', unidade: '%', periodo: String(anoFechado), frequencia: 'anual', fontes: [fonte(pubAno)],
      calculo: 'Cálculo do StatWorld: exportações do estado ÷ exportações do país × 100.',
      valores: Object.fromEntries(SIGLAS.map((s) => [s, valores[s] == null ? null : Math.round((valores[s] / totalAno) * 1e6) / 1e4])),
    },
  },
};

// ---------- 2. Produtos e países (nomes em português pelo Comex Stat) ----------
const nomesSh4 = {};
for (const fluxo of ['export', 'import']) {
  const lista = await comex('general?language=pt', { flow: fluxo, monthDetail: false, period: { from: `${anoFechado}-01`, to: `${anoFechado}-12` }, filters: [], details: ['heading'], metrics: ['metricFOB'] });
  for (const l of lista) nomesSh4[l.headingCode] = l.heading;
  await espera(3000);
}
const produtosBrutos = (await census(`exports/hs?get=E_COMMODITY,E_COMMODITY_LDESC,ALL_VAL_YR&time=${dez}&COMM_LVL=HS4`))
  .map((l) => ({ codigo: l.E_COMMODITY, valor: Number(l.ALL_VAL_YR), ingles: l.E_COMMODITY_LDESC }))
  .sort((a, b) => b.valor - a.valor).slice(0, 10);
// Códigos próprios dos EUA (não existem na classificação do Brasil): nome traduzido da descrição oficial do Census.
const CODIGOS_EUA = { '8800': 'Aeronaves civis, motores e partes', '9880': 'Remessas de baixo valor (vários produtos)' };
const semNome = [];
const produtos = produtosBrutos.map((p) => {
  const nome = nomesSh4[p.codigo] ?? CODIGOS_EUA[p.codigo];
  if (!nome) semNome.push(p.codigo);
  return { codigo: p.codigo, nome: nome ?? p.ingles.toLowerCase().replace(/^./, (c) => c.toUpperCase()), valor: p.valor, parte: Math.round((p.valor / totalAno) * 1e4) / 100 };
});
// Países: Census (inglês) -> Comex Stat (inglês) -> Comex Stat (português).
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
const paisesEn = await comex('tables/countries?language=en');
await espera(2000);
const paisesPt = Object.fromEntries((await comex('tables/countries?language=pt')).map((p) => [p.id, p.text.trim()]));
const idPorNome = new Map(paisesEn.map((p) => [norm(p.text), p.id]));
// Nomes que o Census escreve de outro jeito (conferido à mão).
const APELIDOS = { 'KOREA SOUTH': 'Coreia do Sul', 'NETHERLANDS': 'Países Baixos (Holanda)', 'TAIWAN': 'Taiwan', 'HONG KONG': 'Hong Kong', 'VIETNAM': 'Vietnã', 'UNITED KINGDOM': 'Reino Unido' };
const parceirosBrutos = (await census(`exports/hs?get=CTY_CODE,CTY_NAME,ALL_VAL_YR&time=${dez}`))
  .filter((l) => /^[1-9]\d{3}$/.test(l.CTY_CODE)) // só países (os códigos 0xxx são blocos e grupos)
  .map((l) => ({ ingles: l.CTY_NAME, valor: Number(l.ALL_VAL_YR) }))
  .sort((a, b) => b.valor - a.valor).slice(0, 10);
const parceiros = parceirosBrutos.map((p) => {
  const n = norm(p.ingles);
  const nome = APELIDOS[n] ?? paisesPt[idPorNome.get(n)];
  if (!nome) semNome.push(p.ingles);
  return { nome: nome ?? p.ingles, valor: p.valor, parte: Math.round((p.valor / totalAno) * 1e4) / 100 };
});
const listas = {
  _explicacao: 'EUA: 10 principais produtos exportados (HS/SH, 4 dígitos; nomes do Comex Stat) e 10 principais países compradores, no último ano completo. Gerado por scripts/eua-comercio/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje, periodo: String(anoFechado), total: totalAno, frequencia: 'anual',
  fontes: [fonte(pubAno)], produtos, parceiros,
};

// ---------- 3. Balança do ano em curso (valores acumulados no ano) ----------
const acumulado = async (fluxo, campo, k) => Number((await census(`${fluxo}/hs?get=${campo}&time=${k}`))[0][campo]);
const kAnt = `${anoAtual - 1}-${String(mesAtual).padStart(2, '0')}`;
const exp = await acumulado('exports', 'ALL_VAL_YR', ultimo), imp = await acumulado('imports', 'GEN_VAL_YR', ultimo);
const expAnt = await acumulado('exports', 'ALL_VAL_YR', kAnt), impAnt = await acumulado('imports', 'GEN_VAL_YR', kAnt);
const periodoBal = mesAtual === 1 ? `janeiro de ${anoAtual}` : `${anoAtual}, janeiro a ${MESES[mesAtual - 1]}`;
const balanca = {
  _explicacao: 'EUA: balança comercial de bens do ano em curso (exportações totais e importações gerais, acumuladas no ano) e o mesmo período do ano anterior. Gerado por scripts/eua-comercio/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje, periodo: periodoBal, frequencia: 'mensal',
  fontes: [fonte(`International Trade, balança de bens, ${periodoBal}`)],
  exportacoes: exp, importacoes: imp, saldo: exp - imp, saldoAnoAnterior: expAnt - impAnt, anoAnterior: anoAtual - 1,
};

await mkdir(new URL('../../dados/comercio/', import.meta.url), { recursive: true });
await writeFile(new URL('../../dados/comercio/eua-estados.json', import.meta.url), JSON.stringify(estados, null, 2));
await writeFile(new URL('../../dados/comercio/eua-listas.json', import.meta.url), JSON.stringify(listas, null, 2));
await writeFile(new URL('../../dados/comercio/eua-balanca.json', import.meta.url), JSON.stringify(balanca, null, 2));
const bi = (v) => `US$ ${(v / 1e9).toFixed(1)} bi`;
console.log(`Exportações ${anoFechado}: ${bi(totalAno)}; ${Object.values(valores).filter((v) => v != null).length} estados com dado.`);
console.log(`Balança ${periodoBal}: exportações ${bi(exp)}, importações ${bi(imp)}, saldo ${bi(exp - imp)} (mesmo período de ${anoAtual - 1}: ${bi(expAnt - impAnt)}).`);
console.log(`Produtos: ${produtos.map((p) => p.nome.slice(0, 30)).join(' | ')}`);
console.log(`Países: ${parceiros.map((p) => p.nome).join(', ')}`);
if (semNome.length) console.log(`Atenção: sem nome em português para: ${semNome.join(', ')} (ficou o nome em inglês).`);
