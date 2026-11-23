// Aba "Preços e poder de compra". Baixa e prepara:
//  1. Inflação em 12 meses (IPCA, IBGE, tabela 1737 do Sidra), mês a mês desde 2019, com a meta e o
//     intervalo de tolerância de cada mês (metas oficiais do Conselho Monetário Nacional, digitadas abaixo).
//  2. Preço da cesta básica na capital de cada estado (DIEESE, Pesquisa Nacional da Cesta Básica,
//     pelo Ipeadata, série CESBTOTAL), mês mais recente.
//  3. Quantas cestas o salário mínimo compra, média de cada ano desde 2000
//     (salário mínimo vigente: Ipeadata, série MTE12_SALMIN12).
// Gera: dados/precos/brasil-ipca.json, dados/precos/brasil-estados.json, dados/precos/brasil-sm-cestas.json
// Como rodar (na pasta statworld):  node scripts/precos/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

// ---- Metas para a inflação (Banco Central / CMN) — conferir no LEIA-ME ------
// Fonte: https://www.bcb.gov.br/controleinflacao/historicometas (conferido em 22 nov 2026).
// Até 2024 a meta valia para o ano-calendário; desde jan/2025 é a "meta contínua" (12 meses, verificada todo mês).
const METAS = [
  { de: 2019, ate: 2019, meta: 4.25, tolerancia: 1.5, norma: 'Resolução CMN nº 4.582' },
  { de: 2020, ate: 2020, meta: 4.0, tolerancia: 1.5, norma: 'Resolução CMN nº 4.582' },
  { de: 2021, ate: 2021, meta: 3.75, tolerancia: 1.5, norma: 'Resolução CMN nº 4.671' },
  { de: 2022, ate: 2022, meta: 3.5, tolerancia: 1.5, norma: 'Resolução CMN nº 4.724' },
  { de: 2023, ate: 2023, meta: 3.25, tolerancia: 1.5, norma: 'Resolução CMN nº 4.831' },
  { de: 2024, ate: 2024, meta: 3.0, tolerancia: 1.5, norma: 'Resolução CMN nº 4.918' },
  { de: 2025, ate: 9999, meta: 3.0, tolerancia: 1.5, norma: 'Resolução CMN nº 5.141 (meta contínua)' },
];
const INICIO_IPCA = '201901';
const INICIO_CESTAS = 2000;
// ----------------------------------------------------------------------------

const SIDRA = 'https://servicodados.ibge.gov.br/api/v3/agregados';
const IPEA = 'http://www.ipeadata.gov.br/api/odata4';
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const PASTA = new URL('../../dados/precos/', import.meta.url);
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

async function baixar(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Erro ${r.status} em ${url}`);
  return r.json();
}
const isoDe = (d) => (d ? d.split('/').reverse().join('-') : null); // "12/11/2026" -> "2026-11-12"
const num = (v) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null);
const nomeMes = (anoMes) => `${MESES[Number(anoMes.slice(4, 6)) - 1]} de ${anoMes.slice(0, 4)}`;
const metaDe = (ano) => METAS.find((m) => ano >= m.de && ano <= m.ate);

// ---------- 1. IPCA em 12 meses ----------
const periodos = (await baixar(`${SIDRA}/1737/periodos`)).filter((p) => p.id >= INICIO_IPCA);
const [ipca] = await baixar(`${SIDRA}/1737/periodos/${periodos.map((p) => p.id).join('|')}/variaveis/2265?localidades=N1%5Ball%5D`);
const serieIpca = ipca.resultados[0].series[0].serie;
const ultimoIpca = periodos.at(-1);
const pontosIpca = periodos.map((p) => {
  const m = metaDe(Number(p.id.slice(0, 4)));
  return { periodo: p.id, nome: p.literals[0], valor: num(serieIpca[p.id]), meta: m?.meta ?? null, min: m ? m.meta - m.tolerancia : null, max: m ? m.meta + m.tolerancia : null };
});
const fimIpca = pontosIpca.at(-1);
const ipcaSaida = {
  _explicacao: 'Inflação em 12 meses (IPCA) com a meta de cada mês. Gerado por scripts/precos/baixar.mjs. Não edite à mão.',
  pais: 'BR',
  baixadoEm: new Date().toISOString().slice(0, 10),
  periodo: nomeMes(ultimoIpca.id),
  ultimo: { valor: fimIpca.valor, meta: fimIpca.meta, min: fimIpca.min, max: fimIpca.max },
  serie: {
    nome: 'Inflação em 12 meses (IPCA), %',
    unidade: '%',
    frequencia: 'mensal',
    fontes: [
      { nome: 'IBGE', publicacao: `IPCA, ${nomeMes(ultimoIpca.id)} (tabela 1737 do Sidra)`, url: 'https://sidra.ibge.gov.br/tabela/1737', dataDivulgacao: isoDe(ultimoIpca.modificacao) },
      { nome: 'Banco Central do Brasil', publicacao: 'Metas para a inflação definidas pelo Conselho Monetário Nacional', url: 'https://www.bcb.gov.br/controleinflacao/historicometas' },
    ],
    pontos: pontosIpca,
  },
};

// ---------- 2. Cesta básica por capital ----------
const estados = await baixar(URL_ESTADOS);
const siglaPorCodigo = new Map(estados.map((e) => [String(e.id), e.sigla]));
const siglas = estados.map((e) => e.sigla).sort();
const metaCesta = (await baixar(`${IPEA}/Metadados('CESBTOTAL')`)).value[0];
const cestas = (await baixar(`${IPEA}/ValoresSerie(SERCODIGO='CESBTOTAL')`)).value
  .filter((v) => v.NIVNOME === 'Municípios' && v.VALVALOR != null)
  .map((v) => ({ mes: v.VALDATA.slice(0, 7).replace('-', ''), municipio: v.TERCODIGO, valor: v.VALVALOR }));
const mesCesta = cestas.map((c) => c.mes).sort().at(-1);
const doMes = cestas.filter((c) => c.mes === mesCesta);
// As capitais são as cidades da pesquisa mais recente. Meses antigos podem ter outra cidade (ex.: em 2015–2018 a série traz
// um município de Roraima que não é a capital): fica de fora, para comparar sempre capitais.
const capitais = new Set(doMes.map((c) => c.municipio));
const sm = (await baixar(`${IPEA}/ValoresSerie(SERCODIGO='MTE12_SALMIN12')`)).value
  .map((v) => ({ mes: v.VALDATA.slice(0, 7).replace('-', ''), valor: v.VALVALOR }));
const smDoMes = (mes) => sm.find((s) => s.mes === mes)?.valor ?? null;
const smAtual = smDoMes(mesCesta);
if (!smAtual) throw new Error(`Sem salário mínimo para ${mesCesta}.`);

// Nome de cada capital (pelo código do município, no IBGE).
const nomes = {};
const valoresCesta = Object.fromEntries(siglas.map((s) => [s, null]));
for (const c of doMes) {
  const sigla = siglaPorCodigo.get(c.municipio.slice(0, 2));
  if (!sigla) continue;
  const mun = await baixar(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${c.municipio}`);
  nomes[sigla] = `${mun.nome} (${sigla})`;
  valoresCesta[sigla] = Math.round(c.valor * 100) / 100;
}
const arred = (v, c) => (v == null ? null : Math.round(v * 10 ** c) / 10 ** c);
const porSigla = (fn) => Object.fromEntries(siglas.map((s) => [s, valoresCesta[s] == null ? null : fn(valoresCesta[s])]));
const fonteCesta = {
  nome: 'DIEESE (via Ipeadata)',
  publicacao: `Pesquisa Nacional da Cesta Básica de Alimentos, ${nomeMes(mesCesta)}`,
  url: 'http://www.ipeadata.gov.br/ExibeSerie.aspx?serid=CESBTOTAL',
  dataAtualizacao: metaCesta.SERATUALIZACAO?.slice(0, 10) ?? null, // data em que o Ipeadata atualizou a série (o DIEESE não informa a data em formato de dados)
};
const fonteSm = { nome: 'Ipeadata', publicacao: 'Salário mínimo vigente (série MTE12_SALMIN12)', url: 'http://www.ipeadata.gov.br/ExibeSerie.aspx?serid=MTE12_SALMIN12' };
const estadosSaida = {
  _explicacao: 'Cesta básica na capital de cada estado (DIEESE) e quanto ela pesa no salário mínimo. Gerado por scripts/precos/baixar.mjs. Não edite à mão. null = capital fora da pesquisa.',
  pais: 'BR',
  nivel: 'estado',
  periodo: nomeMes(mesCesta),
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: {
    cesta: {
      nome: 'Preço da cesta básica na capital',
      unidade: 'moeda',
      periodo: nomeMes(mesCesta),
      frequencia: 'mensal',
      nomes, // a cesta é medida na capital: o ranking mostra o nome dela
      fontes: [fonteCesta],
      calculo: 'Valor publicado pelo DIEESE: custo mensal da cesta básica de alimentos na capital (uma pessoa adulta).',
      valores: valoresCesta,
    },
    'cesta-parte-sm': {
      nome: 'Parte do salário mínimo que a cesta custa',
      unidade: '%',
      periodo: nomeMes(mesCesta),
      frequencia: 'mensal',
      fontes: [fonteCesta, fonteSm],
      calculo: `Cálculo do StatWorld: preço da cesta ÷ salário mínimo bruto do mês (R$ ${smAtual}) × 100. O DIEESE publica a conta com o salário mínimo líquido (descontada a Previdência), que dá um número um pouco maior.`,
      valores: porSigla((c) => arred((c / smAtual) * 100, 2)),
    },
    'cesta-cestas-sm': {
      nome: 'Cestas que o salário mínimo compra',
      unidade: 'numero',
      periodo: nomeMes(mesCesta),
      frequencia: 'mensal',
      fontes: [fonteCesta, fonteSm],
      calculo: `Cálculo do StatWorld: salário mínimo bruto do mês (R$ ${smAtual}) ÷ preço da cesta.`,
      valores: porSigla((c) => arred(smAtual / c, 4)),
    },
  },
};

// ---------- 3. Salário mínimo em cestas, média de cada ano ----------
// Em cada mês: salário mínimo ÷ preço médio da cesta nas capitais pesquisadas naquele mês. Depois, a média dos meses do ano.
const porMes = new Map();
for (const c of cestas) {
  if (Number(c.mes.slice(0, 4)) < INICIO_CESTAS || !capitais.has(c.municipio)) continue;
  if (!porMes.has(c.mes)) porMes.set(c.mes, []);
  porMes.get(c.mes).push(c.valor);
}
const anos = new Map();
for (const [mes, vals] of [...porMes.entries()].sort()) {
  const s = smDoMes(mes);
  if (!s || !vals.length) continue;
  const media = vals.reduce((a, b) => a + b, 0) / vals.length;
  const ano = mes.slice(0, 4);
  if (!anos.has(ano)) anos.set(ano, { razoes: [], capitais: new Set(), meses: [] });
  const a = anos.get(ano);
  a.razoes.push(s / media);
  a.capitais.add(vals.length);
  a.meses.push(mes);
}
const pontosSm = [...anos.entries()].map(([ano, a]) => ({
  periodo: ano,
  nome: a.meses.length < 12 ? `${ano} (${MESES[Number(a.meses[0].slice(4)) - 1].slice(0, 3)}–${MESES[Number(a.meses.at(-1).slice(4)) - 1].slice(0, 3)})` : ano,
  valor: arred(a.razoes.reduce((x, y) => x + y, 0) / a.razoes.length, 2),
  meses: a.meses.length,
  capitais: Math.max(...a.capitais),
}));
const smSaida = {
  _explicacao: 'Quantas cestas básicas o salário mínimo compra, média de cada ano. Gerado por scripts/precos/baixar.mjs. Não edite à mão.',
  pais: 'BR',
  baixadoEm: new Date().toISOString().slice(0, 10),
  salarioMinimo: smAtual,
  serie: {
    nome: 'Cestas básicas que o salário mínimo compra',
    unidade: 'numero',
    frequencia: 'mensal',
    fontes: [fonteCesta, fonteSm],
    calculo: 'Cálculo do StatWorld: em cada mês, salário mínimo bruto ÷ preço médio da cesta nas capitais pesquisadas naquele mês; depois, a média dos meses do ano. O número de capitais pesquisadas mudou ao longo do tempo (hoje são 27), o que afeta um pouco a comparação entre anos.',
    pontos: pontosSm,
  },
};

await mkdir(PASTA, { recursive: true });
await writeFile(new URL('brasil-ipca.json', PASTA), JSON.stringify(ipcaSaida, null, 2));
await writeFile(new URL('brasil-estados.json', PASTA), JSON.stringify(estadosSaida, null, 2));
await writeFile(new URL('brasil-sm-cestas.json', PASTA), JSON.stringify(smSaida, null, 2));
console.log(`IPCA 12 meses em ${nomeMes(ultimoIpca.id)}: ${fimIpca.valor}% (meta ${fimIpca.meta}%, de ${fimIpca.min}% a ${fimIpca.max}%).`);
console.log(`Cesta básica de ${nomeMes(mesCesta)}: ${doMes.length} capitais. Salário mínimo: R$ ${smAtual}.`);
console.log(`Salário mínimo em cestas: ${pontosSm[0].periodo} a ${pontosSm.at(-1).periodo}.`);
