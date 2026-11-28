// Tema Demografia: o tempo (pirâmides de 1980 a 2070, nascimentos, mortes, esperança de vida, filhos por mulher) e a migração.
//  1. IBGE, Projeções da População, Revisão 2024 (planilhas no servidor do IBGE, 2000–2070, Brasil e estados):
//     pirâmides (grupos de 5 anos) e indicadores (nascimentos, óbitos, esperança de vida por sexo, filhos por mulher).
//  2. IBGE, Censos de 1980, 1991, 2000 e 2010 (tabela 200 do Sidra, amostra): pirâmides por sexo e grupo de 5 anos.
//     A de 2022 vem de dados/demografia/brasil-estados.json (scripts/populacao/).
//  3. IBGE, Estatísticas do Registro Civil (tabelas 2609 e 2654): nascidos vivos registrados e óbitos ocorridos, 2015–2024,
//     Brasil e estados, e o último ano por município.
//  4. IBGE, Censo 2022 (tabela 631): população de cada estado por lugar de nascimento → quem nasceu em outro estado, fluxos.
// Gera: dados/demografia/brasil-series.json (Brasil e estados) e dados/demografia/brasil-municipios-vital.json (municípios)
// Como rodar (na pasta statworld):  node scripts/demografia-series/baixar.mjs

import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx');

const API = 'https://servicodados.ibge.gov.br/api/v3/agregados';
const FTP_PROJ = 'https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024';
const ANOS_PROJ = [2030, 2040, 2050, 2060, 2070];
const ANOS_CENSO = ['1980', '1991', '2000', '2010'];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => (v === '-' ? 0 : v == null || v === '' || /^(X|\.\.\.?)$/.test(v) ? null : Number(v));
async function sidra(caminho) {
  for (let i = 1; i <= 6; i++) {
    const r = await fetch(`${API}/${caminho}`);
    if (r.ok) { const j = await r.json(); if (Array.isArray(j)) return j; }
    await espera(4000 * i);
  }
  throw new Error(`O IBGE não respondeu: ${API}/${caminho}`);
}
// [{ cats: "a|b", local, ano, valor }]
function linhas(resp) {
  const out = [];
  for (const v of resp) for (const res of v.resultados) {
    const cats = res.classificacoes.map((c) => Object.keys(c.categoria)[0]).join('|');
    for (const s of res.series) for (const [ano, val] of Object.entries(s.serie)) out.push({ cats, local: s.localidade.id, ano, valor: num(val) });
  }
  return out;
}
const estados = await (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).json();
const siglaDe = Object.fromEntries(estados.map((e) => [String(e.id), e.sigla]));
const chave = (id) => (id === '1' || id === '0' ? 'BR' : siglaDe[id]);
const GRUPOS = ['0–4', '5–9', '10–14', '15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49', '50–54', '55–59', '60–64', '65–69', '70–74', '75–79', '80+'];

// ---------- 1. Projeções 2024 ----------
const pasta = join(tmpdir(), 'statworld-projecoes');
await rm(pasta, { recursive: true, force: true }); await mkdir(pasta, { recursive: true });
const baixar = (arq) => { const p = join(pasta, arq); execFileSync('curl', ['-s', '-f', '-m', '600', '-o', p, `${FTP_PROJ}/${arq}`]); return XLSX.readFile(p); };
console.log('Projeções da População, revisão 2024...');
const tab2 = XLSX.utils.sheet_to_json(baixar('projecoes_2024_tab2_grupo_quinquenal.xlsx').Sheets['2) POP_GRUPO QUINQUENAL'], { header: 1, defval: null });
const cab2 = tab2.findIndex((r) => r[0] === 'GRUPO ETÁRIO');
if (cab2 < 0 || tab2[cab2][3] !== 'SIGLA') throw new Error('A planilha de população projetada mudou (tab2).');
const colAno = (a) => tab2[cab2].indexOf(a);
const piramides = {}; // lugar -> ano -> {h:[17], m:[17]}
for (const r of tab2.slice(cab2 + 1)) {
  if (!r[0] || !r[3] || !['Homens', 'Mulheres'].includes(r[1])) continue;
  const ini = Number(String(r[0]).trim().slice(0, 2)); // " 00-04" ... " 90+"
  if (Number.isNaN(ini)) continue;
  const i = Math.min(16, Math.floor(ini / 5)); // 80 em diante vira "80+"
  const lugar = r[3] === 'BR' ? 'BR' : r[3];
  for (const ano of ANOS_PROJ) {
    const v = r[colAno(ano)]; if (v == null) continue;
    const o = ((piramides[lugar] ??= {})[ano] ??= { h: Array(17).fill(0), m: Array(17).fill(0) });
    o[r[1] === 'Homens' ? 'h' : 'm'][i] += v;
  }
}
const tab4 = XLSX.utils.sheet_to_json(baixar('projecoes_2024_tab4_indicadores.xlsx').Sheets['4) INDICADORES'], { header: 1, defval: null });
const cab4 = tab4.findIndex((r) => r[0] === 'ANO' && r[2] === 'SIGLA');
const C4 = Object.fromEntries(tab4[cab4].map((n, i) => [n, i]));
for (const n of ['NASC_T', 'OBT_T', 'e0_T', 'e0_H', 'e0_M', 'TFT', 'POP_T', 'IE65', 'ID_MED']) if (C4[n] == null) throw new Error(`A planilha de indicadores mudou: falta ${n}.`);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const projecao = {}; // lugar -> ano -> {...}
for (const r of tab4.slice(cab4 + 1)) {
  if (typeof r[0] !== 'number' || !r[2]) continue;
  ((projecao[r[2]] ??= {})[r[0]] = { pop: r[C4.POP_T], nascimentos: Math.round(r[C4.NASC_T]), obitos: Math.round(r[C4.OBT_T]), e0: r2(r[C4.e0_T]), e0Homens: r2(r[C4.e0_H]), e0Mulheres: r2(r[C4.e0_M]), filhosPorMulher: r2(r[C4.TFT]), envelhecimento65: r2(r[C4.IE65]), idadeMediana: r2(r[C4.ID_MED]) });
}
await rm(pasta, { recursive: true, force: true });

// ---------- 2. Censos antigos (pirâmides) ----------
console.log('Censos de 1980 a 2010 (pirâmides)...');
const G200 = ['1140', '1141', '1142', '1143', '1144', '1145', '1146', '1147', '1148', '1149', '1150', '1151', '1152', '1153', '1154', '1155', '2503'];
for (const ano of ANOS_CENSO) {
  const l = linhas(await sidra(`200/periodos/${ano}/variaveis/93?localidades=N1[all]|N3[all]&classificacao=2[4,5]|1[0]|58[${G200.join(',')}]`));
  for (const x of l) {
    const [sexo, , grupo] = x.cats.split('|'); const i = G200.indexOf(grupo); const lugar = chave(x.local);
    if (i < 0 || !lugar) continue;
    const o = ((piramides[lugar] ??= {})[ano] ??= { h: Array(17).fill(null), m: Array(17).fill(null) });
    o[sexo === '4' ? 'h' : 'm'][i] = x.valor;
  }
  await espera(500);
}
// 2022 (Censo), a partir do arquivo do scripts/populacao/ (21 grupos → 17, juntando 80+).
const pop = JSON.parse(await readFile(new URL('../../dados/demografia/brasil-estados.json', import.meta.url), 'utf8'));
for (const [lugar, p] of Object.entries(pop.piramides.valores)) {
  if (!p) continue;
  const j = (a) => [...a.slice(0, 16), a.slice(16).reduce((s, v) => s + v, 0)];
  (piramides[lugar] ??= {})['2022'] = { h: j(p.homens), m: j(p.mulheres) };
}

// ---------- 3. Registro Civil ----------
console.log('Registro Civil (nascimentos e óbitos)...');
const ANOS_RC = Array.from({ length: 10 }, (_, k) => String(2015 + k));
const nascimentos = {}, obitos = {};
const lerRC = (l, alvo) => { for (const x of l) { const lugar = chave(x.local); if (lugar) ((alvo[lugar] ??= {})[x.ano] = x.valor); } };
lerRC(linhas(await sidra(`2609/periodos/${ANOS_RC.join('|')}/variaveis/217?localidades=N1[all]|N3[all]&classificacao=232[0]|240[0]|2[0]`)), nascimentos);
lerRC(linhas(await sidra(`2654/periodos/${ANOS_RC.join('|')}/variaveis/343?localidades=N1[all]|N3[all]&classificacao=244[0]|1836[0]|2[0]|260[0]|257[0]`)), obitos);
const ultimoRC = ANOS_RC.filter((a) => nascimentos.BR?.[a] != null).at(-1);
console.log(`Registro Civil até ${ultimoRC}; municípios...`);
const nascMun = {}, obitMun = {};
for (const id of Object.keys(siglaDe)) {
  for (const x of linhas(await sidra(`2609/periodos/${ultimoRC}/variaveis/217?localidades=N6[N3[${id}]]&classificacao=232[0]|240[0]|2[0]`))) nascMun[x.local] = x.valor;
  for (const x of linhas(await sidra(`2654/periodos/${ultimoRC}/variaveis/343?localidades=N6[N3[${id}]]&classificacao=244[0]|1836[0]|2[0]|260[0]|257[0]`))) obitMun[x.local] = x.valor;
  process.stdout.write(`${siglaDe[id]} `); await espera(300);
}
console.log('');

// ---------- 4. Migração (Censo 2022, lugar de nascimento) ----------
console.log('Migração (lugar de nascimento, Censo 2022)...');
const NASC_UF = { 3256: 'RO', 3257: 'AC', 3258: 'AM', 3259: 'RR', 3260: 'PA', 3261: 'AP', 3262: 'TO', 3263: 'MA', 3264: 'PI', 3265: 'CE', 3266: 'RN', 3267: 'PB', 3268: 'PE', 3269: 'AL', 3270: 'SE', 3271: 'BA', 3272: 'MG', 3273: 'ES', 3284: 'RJ', 3274: 'SP', 3275: 'PR', 3276: 'SC', 3277: 'RS', 3278: 'MS', 3279: 'MT', 3280: 'GO', 3281: 'DF' };
const mig = linhas(await sidra(`631/periodos/2022/variaveis/93?localidades=N1[all]|N3[all]&classificacao=2[0]|183[0,${Object.keys(NASC_UF).join(',')},3282]`));
const migracao = {}; // lugar onde mora -> { total, mesmoEstado, outroEstado, exterior, porOrigem: {UF: n} }
for (const x of mig) {
  const onde = chave(x.local); if (!onde) continue;
  const [, origem] = x.cats.split('|');
  const o = (migracao[onde] ??= { total: null, mesmoEstado: null, outroEstado: 0, exterior: null, porOrigem: {} });
  if (origem === '0') o.total = x.valor;
  else if (origem === '3282') o.exterior = x.valor;
  else if (NASC_UF[origem]) { if (NASC_UF[origem] === onde) o.mesmoEstado = x.valor; else { o.porOrigem[NASC_UF[origem]] = x.valor; } }
}
for (const [onde, o] of Object.entries(migracao)) if (onde !== 'BR') o.outroEstado = Object.values(o.porOrigem).reduce((s, v) => s + (v ?? 0), 0);
// Quem saiu: nascidos em cada estado que moram em outro.
for (const uf of Object.values(NASC_UF)) migracao[uf].saiu = Object.entries(migracao).filter(([o]) => o !== 'BR' && o !== uf).reduce((s, [, m]) => s + (m.porOrigem[uf] ?? 0), 0);
// Maiores fluxos entre estados.
const fluxos = Object.entries(migracao).filter(([o]) => o !== 'BR').flatMap(([para, m]) => Object.entries(m.porOrigem).map(([de, n]) => ({ de, para, pessoas: n }))).sort((a, b) => b.pessoas - a.pessoas).slice(0, 40);

const fontes = {
  projecao: { nome: 'IBGE', publicacao: 'Projeções da População, revisão 2024', url: `${FTP_PROJ}/`, dataDivulgacao: '2024-08-22' },
  censos: { nome: 'IBGE', publicacao: 'Censos Demográficos 1980 a 2010 (tabela 200, amostra)', url: 'https://sidra.ibge.gov.br/tabela/200' },
  censo2022: { nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 9514)', url: 'https://sidra.ibge.gov.br/tabela/9514' },
  nascimentos: { nome: 'IBGE', publicacao: `Estatísticas do Registro Civil ${ultimoRC} (tabela 2609)`, url: 'https://sidra.ibge.gov.br/tabela/2609' },
  obitos: { nome: 'IBGE', publicacao: `Estatísticas do Registro Civil ${ultimoRC} (tabela 2654)`, url: 'https://sidra.ibge.gov.br/tabela/2654' },
  migracao: { nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 631)', url: 'https://sidra.ibge.gov.br/tabela/631' },
};
const anosPir = [...ANOS_CENSO.map(Number), 2022, ...ANOS_PROJ];
const saida = {
  _explicacao: 'Demografia no tempo e migração, Brasil (BR) e estados. Gerado por scripts/demografia-series/baixar.mjs. Não edite à mão. Pirâmides: 17 grupos de 5 anos (o último é 80+), h = homens, m = mulheres. Anos de projeção são do IBGE (revisão 2024), não medição.',
  baixadoEm: new Date().toISOString().slice(0, 10), fontes,
  piramides: { grupos: GRUPOS, anos: anosPir, tipo: Object.fromEntries(anosPir.map((a) => [a, a > 2022 ? 'projecao' : 'censo'])), valores: piramides },
  registroCivil: { anos: ANOS_RC, ultimoAno: ultimoRC, nascimentos, obitos, nota: 'Nascidos vivos registrados no ano e óbitos ocorridos no ano, pelo lugar de residência. Registros feitos com atraso entram em anos seguintes.' },
  projecao: { anos: Object.keys(projecao.BR ?? {}).map(Number), valores: projecao },
  migracao: { periodo: '2022', valores: migracao, maioresFluxos: fluxos, nota: 'Pessoas que moram em cada estado, pelo estado onde nasceram (Censo 2022). Não diz quando a pessoa se mudou.' },
};
const dir = new URL('../../dados/demografia/', import.meta.url);
await writeFile(new URL('brasil-series.json', dir), JSON.stringify(saida));
await writeFile(new URL('brasil-municipios-vital.json', dir), JSON.stringify({
  _explicacao: `Nascidos vivos registrados e óbitos ocorridos em ${ultimoRC}, por município de residência (IBGE, Registro Civil). Gerado por scripts/demografia-series/baixar.mjs. Não edite à mão.`,
  periodo: ultimoRC, frequencia: 'anual', fontes: [fontes.nascimentos, fontes.obitos], baixadoEm: saida.baixadoEm,
  nascimentos: nascMun, obitos: obitMun,
}));
const b = projecao.BR?.[2026];
console.log(`Pronto. Pirâmides ${anosPir.join(', ')}; nascimentos BR ${ultimoRC}: ${nascimentos.BR?.[ultimoRC]}; óbitos: ${obitos.BR?.[ultimoRC]}; esperança de vida 2026 (projeção): ${b?.e0}; ${Object.keys(nascMun).length} municípios; maior fluxo: ${fluxos[0]?.de}→${fluxos[0]?.para} ${fluxos[0]?.pessoas}.`);
