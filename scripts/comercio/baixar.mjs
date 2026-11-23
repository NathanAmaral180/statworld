// Aba "Comércio exterior". Baixa do Comex Stat (Secex/MDIC, API oficial: api-comexstat.mdic.gov.br):
//  1. Exportações de cada estado no último ano completo (mapa, ranking e ficha).
//  2. Os 10 principais produtos exportados e os 10 principais países compradores no mesmo ano.
//     Produtos pela classificação internacional CUCI/SITC (nível "posição"), a mesma usada pelo MDIC nos destaques.
//  3. Balança comercial do ano em curso (janeiro até o último mês com dado) e o mesmo período do ano anterior.
// Valores em dólares (FOB). A data vem do próprio Comex Stat ("dados atualizados em").
// Gera: dados/comercio/brasil-estados.json, brasil-listas.json, brasil-balanca.json
// Como rodar (na pasta statworld):  node scripts/comercio/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const API = 'https://api-comexstat.mdic.gov.br';
const PASTA = new URL('../../dados/comercio/', import.meta.url);
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function consulta(corpo) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const r = await fetch(`${API}/general?language=pt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
    if (r.ok) {
      const j = await r.json();
      if (j.success && j.data?.list) return j.data.list;
    }
    await espera(3000 * tentativa); // a API limita pedidos seguidos: espera e tenta de novo
  }
  throw new Error(`O Comex Stat não respondeu à consulta ${JSON.stringify(corpo)}`);
}
const total = async (fluxo, de, ate) => Number((await consulta({ flow: fluxo, monthDetail: false, period: { from: de, to: ate }, filters: [], details: [], metrics: ['metricFOB'] }))[0]?.metricFOB ?? NaN);

// Último mês com dado e data da atualização.
const atual = (await (await fetch(`${API}/general/dates/updated`)).json()).data;
const anoAtual = Number(atual.year), mesAtual = Number(atual.monthNumber);
const atualizadoEm = atual.updated; // ex.: "2026-11-06"
const anoFechado = mesAtual === 12 ? anoAtual : anoAtual - 1; // último ano completo
const fonte = (publicacao) => ({ nome: 'Secex/MDIC', publicacao, url: 'https://comexstat.mdic.gov.br', dataAtualizacao: atualizadoEm });

// ---------- 1. Exportações por estado (ano fechado) ----------
const estados = await (await fetch(URL_ESTADOS)).json();
const siglaPorNome = new Map(estados.map((e) => [e.nome, e.sigla]));
const siglas = estados.map((e) => e.sigla).sort();
const deA = `${anoFechado}-01`, ateA = `${anoFechado}-12`;
const porEstado = await consulta({ flow: 'export', monthDetail: false, period: { from: deA, to: ateA }, filters: [], details: ['state'], metrics: ['metricFOB'] });
const totalAno = await total('export', deA, ateA);
const valores = Object.fromEntries(siglas.map((s) => [s, null]));
let semEstado = 0;
for (const l of porEstado) {
  const s = siglaPorNome.get(l.state);
  if (s) valores[s] = Number(l.metricFOB);
  else semEstado += Number(l.metricFOB); // "Não Declarada" e similares: só no total do país
}
const encontrados = Object.values(valores).filter((v) => v !== null).length;
if (encontrados < 27) console.log(`Atenção: ${27 - encontrados} estados sem valor de exportação em ${anoFechado}.`);
const pubAno = `Comex Stat, exportações de ${anoFechado}`;
const estadosSaida = {
  _explicacao: 'Exportações de cada estado (US$, FOB) no último ano completo. Gerado por scripts/comercio/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR',
  nivel: 'estado',
  periodo: String(anoFechado),
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: {
    exportacoes: {
      nome: `Exportações em ${anoFechado}`,
      unidade: 'moeda-usd',
      periodo: String(anoFechado),
      frequencia: 'anual',
      fontes: [fonte(pubAno)],
      calculo: `Valor publicado pela Secex: o que empresas de cada estado venderam ao exterior (US$, FOB). O total do país (US$ ${(totalAno / 1e9).toFixed(1)} bi) inclui US$ ${(semEstado / 1e9).toFixed(1)} bi sem estado declarado.`,
      valorPais: totalAno,
      valores,
    },
    'parte-exportacoes': {
      nome: 'Parte das exportações do país',
      unidade: '%',
      periodo: String(anoFechado),
      frequencia: 'anual',
      fontes: [fonte(pubAno)],
      calculo: 'Cálculo do StatWorld: exportações do estado ÷ exportações do país × 100.',
      valores: Object.fromEntries(siglas.map((s) => [s, valores[s] == null ? null : Math.round((valores[s] / totalAno) * 1e6) / 1e4])),
    },
  },
};

// ---------- 2. Principais produtos e parceiros (ano fechado) ----------
async function top10(detalhe, campoNome) {
  const lista = await consulta({ flow: 'export', monthDetail: false, period: { from: deA, to: ateA }, filters: [], details: [detalhe], metrics: ['metricFOB'] });
  return lista
    .map((l) => ({ nome: l[campoNome], valor: Number(l.metricFOB) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)
    .map((x) => ({ ...x, parte: Math.round((x.valor / totalAno) * 1e4) / 100 }));
}
const produtos = await top10('SITCGroup', 'SITCGroup');
const parceiros = await top10('country', 'country');
const listasSaida = {
  _explicacao: 'Os 10 principais produtos exportados (classificação CUCI/SITC, posição) e os 10 principais países compradores, no último ano completo. Gerado por scripts/comercio/baixar.mjs. Não edite à mão.',
  pais: 'BR',
  baixadoEm: new Date().toISOString().slice(0, 10),
  periodo: String(anoFechado),
  total: totalAno,
  frequencia: 'anual',
  fontes: [fonte(pubAno)],
  produtos,
  parceiros,
};

// ---------- 3. Balança do ano em curso ----------
const mm = String(mesAtual).padStart(2, '0');
const exp = await total('export', `${anoAtual}-01`, `${anoAtual}-${mm}`);
const imp = await total('import', `${anoAtual}-01`, `${anoAtual}-${mm}`);
const expAnt = await total('export', `${anoAtual - 1}-01`, `${anoAtual - 1}-${mm}`);
const impAnt = await total('import', `${anoAtual - 1}-01`, `${anoAtual - 1}-${mm}`);
const periodoBalanca = mesAtual === 1 ? `janeiro de ${anoAtual}` : `${anoAtual}, janeiro a ${MESES[mesAtual - 1]}`;
const balancaSaida = {
  _explicacao: 'Balança comercial do ano em curso (janeiro até o último mês com dado) e o mesmo período do ano anterior, em US$ FOB. Gerado por scripts/comercio/baixar.mjs. Não edite à mão.',
  pais: 'BR',
  baixadoEm: new Date().toISOString().slice(0, 10),
  periodo: periodoBalanca,
  frequencia: 'mensal',
  fontes: [fonte(`Comex Stat, balança comercial, ${periodoBalanca}`)],
  exportacoes: exp,
  importacoes: imp,
  saldo: exp - imp,
  saldoAnoAnterior: expAnt - impAnt,
  anoAnterior: anoAtual - 1,
};

await mkdir(PASTA, { recursive: true });
await writeFile(new URL('brasil-estados.json', PASTA), JSON.stringify(estadosSaida, null, 2));
await writeFile(new URL('brasil-listas.json', PASTA), JSON.stringify(listasSaida, null, 2));
await writeFile(new URL('brasil-balanca.json', PASTA), JSON.stringify(balancaSaida, null, 2));
const bi = (v) => `US$ ${(v / 1e9).toFixed(2)} bi`;
console.log(`Exportações ${anoFechado}: ${bi(totalAno)} (${encontrados} estados). Dados atualizados em ${atualizadoEm}.`);
console.log(`Balança ${periodoBalanca}: exportações ${bi(exp)}, importações ${bi(imp)}, saldo ${bi(exp - imp)} (mesmo período de ${anoAtual - 1}: ${bi(expAnt - impAnt)}).`);
console.log(`Maior produto: ${produtos[0].nome}. Maior parceiro: ${parceiros[0].nome}.`);
