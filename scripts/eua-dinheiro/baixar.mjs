// Estados Unidos: Dinheiro e juros (painel de séries, mesmo formato do Brasil). Fontes sem chave:
//  - Fed (Federal Reserve), H.15: taxa efetiva dos fundos federais (diária) — o "juro básico" dos EUA;
//  - Tesouro dos EUA: rendimento dos títulos de 2 e de 10 anos (diário, "Daily Treasury Par Yield Curve Rates");
//  - Freddie Mac (PMMS): juro médio da hipoteca de 30 anos (semanal).
// Gera: dados/dinheiro/eua-series.json
// Como rodar (na pasta statworld):  node scripts/eua-dinheiro/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const ANOS = 5;
const hoje = new Date().toLocaleDateString('sv-SE');
const inicio = `${new Date().getFullYear() - ANOS}-${hoje.slice(5)}`;
const UA = { headers: { 'User-Agent': 'Mozilla/5.0' } };
async function texto(url) {
  for (let t = 1; t <= 4; t++) {
    const r = await fetch(url, UA);
    if (r.ok) { const s = await r.text(); if (s.trim()) return s; }
    await new Promise((x) => setTimeout(x, 2000 * t));
  }
  throw new Error(`Sem resposta de ${url}`);
}
const mdyParaIso = (d) => { const [m, dd, a] = d.split('/'); return `${a}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`; };

// Fed: taxa efetiva dos fundos federais (H.15, série RIFSPFF_N.D). O identificador abaixo é o do Data Download Program do Fed.
const URL_FED = 'https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=c5025f4bbbed155a6f17c587772ed69e&lastobs=1900&from=&to=&filetype=csv&label=include&layout=seriescolumn';
const fed = (await texto(URL_FED)).split(/\r?\n/).map((l) => l.split(',')).filter((c) => /^\d{4}-\d\d-\d\d$/.test(c[0]) && c[1] && !isNaN(Number(c[1])))
  .map(([d, v]) => ({ data: d, valor: Number(v) })).filter((p) => p.data >= inicio);

// Tesouro: um arquivo por ano.
const titulos = { '2 Yr': [], '10 Yr': [] };
for (let ano = Number(inicio.slice(0, 4)); ano <= new Date().getFullYear(); ano++) {
  const csv = await texto(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${ano}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${ano}&page&_format=csv`);
  const [cab, ...linhas] = csv.trim().split(/\r?\n/);
  const cols = cab.split(',').map((c) => c.replace(/"/g, ''));
  for (const l of linhas) {
    const c = l.split(',');
    for (const k of Object.keys(titulos)) { const v = Number(c[cols.indexOf(k)]); if (c[cols.indexOf(k)] && Number.isFinite(v)) titulos[k].push({ data: mdyParaIso(c[0]), valor: v }); }
  }
}
for (const k of Object.keys(titulos)) titulos[k] = titulos[k].filter((p) => p.data >= inicio).sort((a, b) => a.data.localeCompare(b.data));

// Freddie Mac: hipoteca de 30 anos (semanal).
const pmms = (await texto('https://www.freddiemac.com/pmms/docs/PMMS_history.csv')).trim().split(/\r?\n/).slice(1).map((l) => l.split(','))
  .filter((c) => c[1] && !isNaN(Number(c[1]))).map((c) => ({ data: mdyParaIso(c[0]), valor: Number(c[1]) })).filter((p) => p.data >= inicio);

const fonte = (nome, publicacao, url) => [{ nome, publicacao, url, dataConsulta: hoje }];
const series = [
  { id: 'fed-funds', nome: 'Juros do Fed', detalhe: 'taxa efetiva dos fundos federais, % ao ano', unidade: '%', casas: 2, frequencia: 'diário', variacao: 'pontos', fontes: fonte('Federal Reserve (EUA)', 'H.15, taxa efetiva dos fundos federais (RIFSPFF_N.D)', 'https://www.federalreserve.gov/releases/h15/'), pontos: fed },
  { id: 'titulo-2', nome: 'Título do Tesouro de 2 anos', detalhe: 'rendimento, % ao ano', unidade: '%', casas: 2, frequencia: 'diário', variacao: 'pontos', fontes: fonte('Tesouro dos EUA', 'Daily Treasury Par Yield Curve Rates, 2 anos', 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates'), pontos: titulos['2 Yr'] },
  { id: 'titulo-10', nome: 'Título do Tesouro de 10 anos', detalhe: 'rendimento, % ao ano', unidade: '%', casas: 2, frequencia: 'diário', variacao: 'pontos', fontes: fonte('Tesouro dos EUA', 'Daily Treasury Par Yield Curve Rates, 10 anos', 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates'), pontos: titulos['10 Yr'] },
  { id: 'hipoteca-30', nome: 'Hipoteca de 30 anos', detalhe: 'juro médio, % ao ano', unidade: '%', casas: 2, frequencia: 'semanal', variacao: 'pontos', fontes: fonte('Freddie Mac (EUA)', 'Primary Mortgage Market Survey, hipoteca de 30 anos com juro fixo', 'https://www.freddiemac.com/pmms'), pontos: pmms },
];
for (const s of series) if (s.pontos.length < 10) throw new Error(`A série ${s.nome} veio com poucos valores.`);

await mkdir(new URL('../../dados/dinheiro/', import.meta.url), { recursive: true });
await writeFile(new URL('../../dados/dinheiro/eua-series.json', import.meta.url), JSON.stringify({
  _explicacao: 'EUA: séries do painel "Dinheiro e juros" (Fed, Tesouro dos EUA, Freddie Mac). Gerado por scripts/eua-dinheiro/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje, series,
}, null, 2));
for (const s of series) console.log(`${s.nome}: ${s.pontos.length} valores, último ${s.pontos.at(-1).valor}% em ${s.pontos.at(-1).data}`);
