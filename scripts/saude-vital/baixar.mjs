// Tema Saúde: nascer e morrer (Ministério da Saúde, pelo TabNet do DATASUS).
//  - SINASC (nascidos vivos, por residência da mãe): total, consultas de pré-natal, tipo de parto, idade da mãe, peso ao nascer.
//  - SIM (óbitos, por residência): total, por capítulo da CID-10, por faixa de idade, óbitos de menores de 1 ano.
// Brasil e estados de 2015 até o último ano disponível (o ano mais recente é preliminar), e os municípios de um estado (UF, padrão SP).
// Também calcula as taxas padronizadas por idade (população padrão: Brasil, Censo 2022), usando a população por idade das
// Projeções do IBGE (revisão 2024) para os estados e a pirâmide do Censo 2022 ajustada à estimativa do ano para os municípios.
// Gera: dados/saude/brasil-vital.json e dados/saude/brasil-<uf>-vital.json
// Como rodar (na pasta statworld):  node scripts/saude-vital/baixar.mjs   (demora; faz cerca de 150 consultas ao TabNet)

import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { tabnet } from '../lib/tabnet.mjs';
const XLSX = createRequire(import.meta.url)('xlsx');

const UF = (process.env.UF ?? 'SP').toUpperCase();
const PRIMEIRO = 2015;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const estados = await (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).json();
const siglaDe = Object.fromEntries(estados.map((e) => [String(e.id), e.sigla]));
const uf = (rot) => siglaDe[String(rot).slice(0, 2)] ?? null; // "35 São Paulo" → SP
const mun6 = (rot) => (/^\d{6}/.test(rot) ? rot.slice(0, 6) : null); // "350950 Campinas" → 350950
const est = estados.find((e) => e.sigla === UF);
const uf2 = UF.toLowerCase();

// Anos disponíveis: os arquivos do formulário do TabNet (obtuf24.dbf ...). O último ano com SIM e SINASC completos é o "final";
// o seguinte, se existir com dado de ano inteiro, é "preliminar".
async function anosDe(def, prefixo) {
  const html = Buffer.from(await (await fetch(`http://tabnet.datasus.gov.br/cgi/tabcgi.exe?${def}`)).arrayBuffer()).toString('latin1');
  return [...html.matchAll(new RegExp(`VALUE="${prefixo}(\\d\\d)\\.dbf"`, 'g'))].map((m) => 2000 + Number(m[1])).sort();
}
const anosSim = await anosDe('sim/cnv/obt10uf.def', 'obtuf');
const anosNasc = await anosDe('sinasc/cnv/nvuf.def', 'nvuf');
const comuns = anosSim.filter((a) => anosNasc.includes(a) && a >= PRIMEIRO);
// O ano corrente ainda está incompleto: fica de fora.
const ANOS = comuns.filter((a) => a < new Date().getFullYear());
const ULTIMO = ANOS.at(-1), FINAL = ANOS.at(-2); // último = preliminar
console.log(`Anos: ${ANOS[0]}–${ULTIMO} (${ULTIMO} preliminar)`);
const aa = (a) => String(a).slice(2);

// Soma uma tabela "lugar × coluna" em { lugar: { coluna: n } }.
const porLugar = (t, chave) => {
  const out = {};
  for (const l of t.linhas) {
    const k = chave(l[0]); if (!k) continue;
    out[k] = Object.fromEntries(t.cabecalho.slice(1).map((c, i) => [c, l[i + 1]]));
  }
  return out;
};
const total = (t, chave) => Object.fromEntries(t.linhas.map((l) => [chave(l[0]), l.at(-1)]).filter(([k]) => k));
const brTotal = (t) => t.total?.at(-1) ?? null;

// ---------- Brasil e estados, ano a ano ----------
const FAIXAS = ['Menor 1 ano', '1 a 4 anos', '5 a 9 anos', '10 a 14 anos', '15 a 19 anos', '20 a 29 anos', '30 a 39 anos', '40 a 49 anos', '50 a 59 anos', '60 a 69 anos', '70 a 79 anos', '80 anos e mais'];
const serie = {}; // ano -> lugar -> {...}
for (const ano of ANOS) {
  const A = (o) => ({ ...o, Arquivos: [`${o.pref}${aa(ano)}.dbf`] });
  const nasc = await tabnet('sinasc/cnv/nvuf.def', A({ pref: 'nvuf', Linha: 'Unidade_da_Federação', Incremento: 'Nascim_p/resid.mãe' }));
  const cons = await tabnet('sinasc/cnv/nvuf.def', A({ pref: 'nvuf', Linha: 'Unidade_da_Federação', Coluna: 'Consult_pré-natal', Incremento: 'Nascim_p/resid.mãe' }));
  const parto = await tabnet('sinasc/cnv/nvuf.def', A({ pref: 'nvuf', Linha: 'Unidade_da_Federação', Coluna: 'Tipo_de_parto', Incremento: 'Nascim_p/resid.mãe' }));
  const idm = await tabnet('sinasc/cnv/nvuf.def', A({ pref: 'nvuf', Linha: 'Unidade_da_Federação', Coluna: 'Idade_da_mãe', Incremento: 'Nascim_p/resid.mãe' }));
  const peso = await tabnet('sinasc/cnv/nvuf.def', A({ pref: 'nvuf', Linha: 'Unidade_da_Federação', Coluna: 'Peso_ao_nascer', Incremento: 'Nascim_p/resid.mãe' }));
  const cap = await tabnet('sim/cnv/obt10uf.def', A({ pref: 'obtuf', Linha: 'Unidade_da_Federação', Coluna: 'Capítulo_CID-10', Incremento: 'Óbitos_p/Residênc' }));
  const fx = await tabnet('sim/cnv/obt10uf.def', A({ pref: 'obtuf', Linha: 'Unidade_da_Federação', Coluna: 'Faixa_Etária', Incremento: 'Óbitos_p/Residênc' }));
  const inf = await tabnet('sim/cnv/inf10uf.def', A({ pref: 'infuf', Linha: 'Unidade_da_Federação', Incremento: 'Óbitos_p/Residênc' }));
  const capBR = await tabnet('sim/cnv/obt10uf.def', A({ pref: 'obtuf', Linha: 'Capítulo_CID-10', Incremento: 'Óbitos_p/Residênc' }));
  const fxBR = await tabnet('sim/cnv/obt10uf.def', A({ pref: 'obtuf', Linha: 'Faixa_Etária', Incremento: 'Óbitos_p/Residênc' }));
  const P = { cons: porLugar(cons, uf), parto: porLugar(parto, uf), idm: porLugar(idm, uf), peso: porLugar(peso, uf), cap: porLugar(cap, uf), fx: porLugar(fx, uf) };
  const nT = total(nasc, uf), iT = total(inf, uf);
  const s = (serie[ano] = {});
  for (const l of Object.keys(nT)) s[l] = { nascimentos: nT[l], obitosInfantis: iT[l] ?? 0, sinasc: { consultas: P.cons[l], parto: P.parto[l], idadeMae: P.idm[l], peso: P.peso[l] }, obitosPorCapitulo: P.cap[l], obitosPorFaixa: P.fx[l] };
  const somaCol = (t) => Object.fromEntries(t.cabecalho.slice(1).map((c, i) => [c, t.total?.[i + 1] ?? null]));
  s.BR = { nascimentos: brTotal(nasc), obitosInfantis: brTotal(inf), sinasc: { consultas: somaCol(cons), parto: somaCol(parto), idadeMae: somaCol(idm), peso: somaCol(peso) },
    obitosPorCapitulo: Object.fromEntries(capBR.linhas.filter((l) => l[0] !== '&').map((l) => [l[0], l[1]])), obitosPorFaixa: Object.fromEntries(fxBR.linhas.filter((l) => l[0] !== '&').map((l) => [l[0], l[1]])) };
  console.log(`${ano}: nascimentos ${s.BR.nascimentos}, óbitos ${Object.values(s.BR.obitosPorFaixa).reduce((a, b) => a + (b ?? 0), 0)}, infantis ${s.BR.obitosInfantis}`);
  await espera(500);
}

// ---------- municípios do estado (últimos 4 anos, para a média de 3 anos e o preliminar) ----------
const ANOS_MUN = ANOS.slice(-4);
const mun = {}; // ano -> código6 -> {...}
for (const ano of ANOS_MUN) {
  const A = (def, pref, o) => tabnet(def, { ...o, Arquivos: [`${pref}${uf2}${aa(ano)}.dbf`] });
  const nasc = await A(`sinasc/cnv/nv${uf2}.def`, 'nv', { Linha: 'Município', Incremento: 'Nascim_p/resid.mãe' });
  const cons = await A(`sinasc/cnv/nv${uf2}.def`, 'nv', { Linha: 'Município', Coluna: 'Consult_pré-natal', Incremento: 'Nascim_p/resid.mãe' });
  const parto = await A(`sinasc/cnv/nv${uf2}.def`, 'nv', { Linha: 'Município', Coluna: 'Tipo_de_parto', Incremento: 'Nascim_p/resid.mãe' });
  const idm = await A(`sinasc/cnv/nv${uf2}.def`, 'nv', { Linha: 'Município', Coluna: 'Idade_da_mãe', Incremento: 'Nascim_p/resid.mãe' });
  const peso = await A(`sinasc/cnv/nv${uf2}.def`, 'nv', { Linha: 'Município', Coluna: 'Peso_ao_nascer', Incremento: 'Nascim_p/resid.mãe' });
  const fx = await A(`sim/cnv/obt10${uf2}.def`, 'obt', { Linha: 'Município', Coluna: 'Faixa_Etária', Incremento: 'Óbitos_p/Residênc' });
  const cap = await A(`sim/cnv/obt10${uf2}.def`, 'obt', { Linha: 'Município', Coluna: 'Capítulo_CID-10', Incremento: 'Óbitos_p/Residênc' });
  const inf = await A(`sim/cnv/inf10${uf2}.def`, 'inf', { Linha: 'Município', Incremento: 'Óbitos_p/Residênc' });
  const P = { cons: porLugar(cons, mun6), parto: porLugar(parto, mun6), idm: porLugar(idm, mun6), peso: porLugar(peso, mun6), fx: porLugar(fx, mun6), cap: porLugar(cap, mun6) };
  const nT = total(nasc, mun6), iT = total(inf, mun6);
  const codigos = new Set([...Object.keys(nT), ...Object.keys(P.fx)]);
  mun[ano] = Object.fromEntries([...codigos].map((c) => [c, { nascimentos: nT[c] ?? 0, obitosInfantis: iT[c] ?? 0, sinasc: { consultas: P.cons[c], parto: P.parto[c], idadeMae: P.idm[c], peso: P.peso[c] }, obitosPorFaixa: P.fx[c], obitosPorCapitulo: P.cap[c] }]));
  console.log(`${UF} ${ano}: ${codigos.size} municípios`);
  await espera(500);
}

// ---------- população por idade (para as taxas padronizadas) ----------
// Estados e Brasil: Projeções da População, revisão 2024 (grupos de 5 anos, ano a ano).
const pasta = join(tmpdir(), 'statworld-saude-proj');
await rm(pasta, { recursive: true, force: true }); await mkdir(pasta, { recursive: true });
const arq = join(pasta, 'tab2.xlsx');
execFileSync('curl', ['-s', '-f', '-m', '600', '-o', arq, 'https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024/projecoes_2024_tab2_grupo_quinquenal.xlsx']);
const tab2 = XLSX.utils.sheet_to_json(XLSX.readFile(arq).Sheets['2) POP_GRUPO QUINQUENAL'], { header: 1, defval: null });
await rm(pasta, { recursive: true, force: true });
const cab2 = tab2.findIndex((r) => r[0] === 'GRUPO ETÁRIO');
// Faixas do SIM a partir dos grupos de 5 anos: 0–4 (Menor 1 + 1 a 4), 5–9, 10–14, 15–19, 20–29, ..., 80+.
const faixaDeIdade = (ini) => (ini < 5 ? 0 : ini < 20 ? Math.floor(ini / 5) : ini >= 80 ? 10 : 4 + Math.floor((ini - 20) / 10));
const popIdade = {}; // lugar -> ano -> [11]
for (const r of tab2.slice(cab2 + 1)) {
  if (r[1] !== 'Ambos' || !r[3]) continue;
  const ini = Number(String(r[0]).trim().slice(0, 2)); if (Number.isNaN(ini)) continue;
  for (const ano of ANOS) {
    const v = r[tab2[cab2].indexOf(ano)]; if (v == null) continue;
    const o = ((popIdade[r[3]] ??= {})[ano] ??= Array(11).fill(0)); o[faixaDeIdade(ini)] += v;
  }
}
// Óbitos por faixa → 11 grupos (Menor 1 + 1 a 4 = 0–4). "Idade ignorada" fica de fora da padronização.
const obit11 = (f) => { if (!f) return null; const v = FAIXAS.map((n) => f[n] ?? 0); return [v[0] + v[1], ...v.slice(2)]; };
// População padrão: Brasil, Censo 2022 (pirâmide do scripts/populacao/), nos mesmos 11 grupos.
const pop = JSON.parse(await readFile(new URL('../../dados/demografia/brasil-estados.json', import.meta.url), 'utf8'));
const pirTo11 = (p) => { const t = p.homens.map((h, i) => h + p.mulheres[i]); const g = Array(11).fill(0); t.forEach((v, i) => { g[faixaDeIdade(i * 5)] += v; }); return g; };
const PADRAO = pirTo11(pop.piramides.valores.BR);
const somaP = PADRAO.reduce((a, b) => a + b, 0);
const padronizada = (obitos, popul) => { if (!obitos || !popul) return null; let s = 0; for (let i = 0; i < 11; i++) { if (!popul[i]) return null; s += (obitos[i] / popul[i]) * PADRAO[i]; } return Math.round((s / somaP) * 1e6) / 10; }; // por 100 mil

// Municípios: pirâmide do Censo 2022 (scripts/piramides-municipios/) ajustada pela estimativa do ano.
const pirMun = JSON.parse(await readFile(new URL(`../../dados/demografia/brasil-${uf2}-piramides.json`, import.meta.url), 'utf8')).valores;
const popMun = JSON.parse(await readFile(new URL('../../dados/demografia/brasil-municipios.json', import.meta.url), 'utf8')).indicadores;
const pir17to11 = (p) => { const t = p[0].map((h, i) => h + p[1][i]); const g = Array(11).fill(0); t.forEach((v, i) => { g[faixaDeIdade(i * 5)] += v; }); return g; };

// Capítulo da CID-10 pelo número romano, venha como "Cap XV" (estados e municípios) ou "XV.  Gravidez..." (Brasil).
const capitulo = (k) => (String(k).match(/^(?:Cap\s+)?([IVXL]+)(?=[.\s]|$)/) ?? [])[1] ?? null;
const porCapitulo = (obj) => { if (!obj) return null; const o = {}; for (const [k, v] of Object.entries(obj)) { const c = capitulo(k); if (c) o[c] = (o[c] ?? 0) + (v ?? 0); } return o; };

// ---------- indicadores ----------
const r1 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);
const pct = (a, b) => (a == null || !b ? null : r1((a / b) * 100));
const col = (obj, re) => (obj ? Object.entries(obj).filter(([k]) => re.test(k)).reduce((s, [, v]) => s + (v ?? 0), 0) : null);
const indic = (x) => {
  const sn = x.sinasc, n = x.nascimentos;
  const cap = porCapitulo(x.obitosPorCapitulo) ?? {};
  return {
    nascimentos: n,
    // Soma das faixas de idade (sem a coluna "Total" que o TabNet devolve junto nos estados e municípios).
    obitos: x.obitosPorFaixa ? Object.entries(x.obitosPorFaixa).filter(([k]) => !/^total$/i.test(k.trim())).reduce((a, [, b]) => a + (b ?? 0), 0) : null,
    obitosInfantis: x.obitosInfantis,
    mortalidadeInfantil: n ? r1((x.obitosInfantis / n) * 1000) : null,
    obitosMaternos: cap.XV ?? 0,
    preNatal7: pct(col(sn.consultas, /7 ou mais/), n),
    cesareas: pct(col(sn.parto, /^Ces/), n),
    maesAte19: pct(col(sn.idadeMae, /^(Menor de 10|10 a 14|15 a 19)/), n),
    baixoPeso: pct(col(sn.peso, /^(Menos de 500|500 a 999|1000 a 1499|1500 a 2499)/), n),
  };
};
const ufs = ['BR', ...Object.values(siglaDe)];
const estadosSaida = Object.fromEntries(ANOS.map((ano) => [ano, Object.fromEntries(ufs.map((l) => {
  const x = serie[ano][l]; if (!x) return [l, null];
  const i = indic(x);
  i.mortesPadronizadas = padronizada(obit11(x.obitosPorFaixa), popIdade[l]?.[ano]);
  i.obitosPorCapitulo = porCapitulo(x.obitosPorCapitulo);
  return [l, i];
}))]));
const munSaida = Object.fromEntries(ANOS_MUN.map((ano) => [ano, Object.fromEntries(Object.entries(mun[ano]).map(([c6, x]) => {
  const i = indic(x);
  const c7 = Object.keys(pirMun).find((c) => c.startsWith(c6));
  const p = c7 && pirMun[c7] ? pir17to11(pirMun[c7]) : null;
  const fator = c7 && popMun.estimativa.valores[c7] && popMun.populacao.valores[c7] ? popMun.estimativa.valores[c7] / popMun.populacao.valores[c7] : 1;
  i.mortesPadronizadas = p ? padronizada(obit11(x.obitosPorFaixa), p.map((v) => v * fator)) : null;
  i.obitosPorCapitulo = porCapitulo(x.obitosPorCapitulo);
  return [c7 ?? c6, i];
}))]));

const fontes = {
  sinasc: { nome: 'Ministério da Saúde', publicacao: 'SINASC, Sistema de Informações sobre Nascidos Vivos (TabNet/DATASUS)', url: 'http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sinasc/cnv/nvuf.def' },
  sim: { nome: 'Ministério da Saúde', publicacao: 'SIM, Sistema de Informações sobre Mortalidade (TabNet/DATASUS)', url: 'http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sim/cnv/obt10uf.def' },
  pop: { nome: 'IBGE', publicacao: 'Projeções da População, revisão 2024; Censo 2022 (população padrão)', url: 'https://ftp.ibge.gov.br/Projecao_da_Populacao/Projecao_da_Populacao_2024/' },
};
const comum = { baixadoEm: new Date().toISOString().slice(0, 10), anoFinal: FINAL, anoPreliminar: ULTIMO, fontes,
  calculos: {
    mortalidadeInfantil: 'Óbitos de menores de 1 ano ÷ nascidos vivos × 1.000 (SIM e SINASC, por residência).',
    mortesPadronizadas: 'Óbitos por 100 mil habitantes padronizados por idade (método direto, 11 faixas, população padrão: Brasil no Censo 2022). Estados: população por idade das Projeções do IBGE (revisão 2024). Municípios: pirâmide do Censo 2022 ajustada à estimativa do IBGE.',
    obitosMaternos: 'Óbitos do capítulo XV da CID-10 (gravidez, parto e puerpério). Aproximação: inclui as mortes maternas tardias.',
    sinasc: '% dos nascidos vivos: 7 ou mais consultas de pré-natal; parto cesáreo; mães com até 19 anos; peso ao nascer abaixo de 2.500 g.',
  },
  nota: `O ano ${ULTIMO} é preliminar: o Ministério da Saúde ainda recebe registros.` };
const dir = new URL('../../dados/saude/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('brasil-vital.json', dir), JSON.stringify({ _explicacao: 'Saúde: nascer e morrer, Brasil (BR) e estados, ano a ano. Gerado por scripts/saude-vital/baixar.mjs. Não edite à mão.', ...comum, anos: ANOS, valores: estadosSaida }));
await writeFile(new URL(`brasil-${uf2}-vital.json`, dir), JSON.stringify({ _explicacao: `Saúde: nascer e morrer, municípios de ${est.nome} (chave = código do IBGE). Gerado por scripts/saude-vital/baixar.mjs. Não edite à mão.`, ...comum, anos: ANOS_MUN, valores: munSaida }));
const b = estadosSaida[FINAL].BR;
console.log(`Pronto. Brasil ${FINAL}: mortalidade infantil ${b.mortalidadeInfantil} por mil; mortes padronizadas ${b.mortesPadronizadas} por 100 mil; cesáreas ${b.cesareas}%; pré-natal 7+ ${b.preNatal7}%.`);
