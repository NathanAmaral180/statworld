// Tema Saúde: planos de saúde (ANS, beneficiários de planos de assistência médica, pelo ANS TabNet), do mês mais recente.
// Brasil, estados e os municípios de um estado (UF, padrão SP). Planos só odontológicos ficam de fora.
// Conta pelo município de residência informado no contrato. Dividido pela população estimada pelo IBGE.
// Gera: dados/saude/brasil-planos.json e dados/saude/brasil-<uf>-planos.json
// Como rodar (na pasta statworld):  node scripts/saude-planos/baixar.mjs

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { tabnet } from '../lib/tabnet.mjs';

const UF = (process.env.UF ?? 'SP').toUpperCase(), uf2 = UF.toLowerCase();
const BASE = 'https://www.ans.gov.br/anstabnet/cgi-bin/tabnet';
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const latin = async (u) => Buffer.from(await (await fetch(u)).arrayBuffer()).toString('latin1');
const estados = await (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).json();
const est = estados.find((e) => e.sigla === UF);
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const siglaPorNome = new Map(estados.map((e) => [norm(e.nome), e.sigla]));

// Mês mais recente (tb_br_AAMM.dbf) e o código do estado no filtro da ANS.
const defBr = await latin('https://www.ans.gov.br/anstabnet/cgi-bin/dh?dados/tabnet_br.def');
const aamm = [...defBr.matchAll(/VALUE="tb_br_(\d{4})\.dbf"/g)].map((m) => m[1]).sort().at(-1);
const periodo = `${MESES[Number(aamm.slice(2)) - 1]} 20${aamm.slice(0, 2)}`;
const def02 = await latin('https://www.ans.gov.br/anstabnet/cgi-bin/dh?dados/tabnet_02.def');
const selUF = def02.slice(def02.indexOf('NAME="SUF"'), def02.indexOf('</SELECT>', def02.indexOf('NAME="SUF"')));
const codUF = [...selUF.matchAll(/VALUE="(\d+)">([^<]*)/g)].find(([, , n]) => norm(n.replace(/&atilde;/g, 'a').replace(/&aacute;/g, 'a').replace(/&ecirc;/g, 'e').replace(/&iacute;/g, 'i').replace(/&ocirc;/g, 'o')) === norm(est.nome))?.[1];
if (!codUF) throw new Error(`Não achei ${est.nome} no filtro de UF da ANS.`);
console.log(`ANS: ${periodo}`);

const uf = await tabnet('dados/tabnet_br.def', { Linha: 'UF', Incremento: 'Assistência_Médica', Arquivos: [`tb_br_${aamm}.dbf`] }, {}, BASE);
const mun = await tabnet('dados/tabnet_02.def', { Linha: 'Município', Incremento: 'Assistência_Médica', Arquivos: [`tb_bb_${aamm}.dbf`] }, { SUF: codUF }, BASE);

const pUF = JSON.parse(await readFile(new URL('../../dados/demografia/brasil-estados.json', import.meta.url), 'utf8')).indicadores.estimativa;
const pMun = JSON.parse(await readFile(new URL('../../dados/demografia/brasil-municipios.json', import.meta.url), 'utf8')).indicadores.estimativa;
const r1 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);
const estSaida = { BR: { beneficiarios: uf.total?.[1] ?? null } };
for (const [nome, n] of uf.linhas) { const s = siglaPorNome.get(norm(nome)); if (s) estSaida[s] = { beneficiarios: n }; }
for (const [l, x] of Object.entries(estSaida)) x.pctPopulacao = r1((x.beneficiarios / pUF.valores[l]) * 100);
// Municípios: a ANS identifica pelo código de 6 dígitos no começo do nome ("350950 Campinas").
const munSaida = {};
const cod7 = Object.keys(pMun.valores).filter((c) => c.startsWith(String(est.id)));
const porSeis = new Map(mun.linhas.map(([nome, n]) => [String(nome).slice(0, 6), n]));
for (const c of cod7) { const n = porSeis.get(c.slice(0, 6)) ?? 0; munSaida[c] = { beneficiarios: n, pctPopulacao: r1((n / pMun.valores[c]) * 100) }; }
if (porSeis.size < cod7.length * 0.8) console.log(`Atenção: só ${porSeis.size} municípios vieram da ANS (esperado perto de ${cod7.length}). Confira o formato dos nomes.`);

const fontes = { ans: { nome: 'ANS', publicacao: `Beneficiários de planos de assistência médica, ${periodo} (ANS TabNet)`, url: 'https://www.ans.gov.br/anstabnet/' }, pop: { nome: 'IBGE', publicacao: `Estimativas da população ${pUF.periodo}`, url: 'https://sidra.ibge.gov.br/tabela/6579' } };
const comum = { periodo, frequencia: 'mensal', baixadoEm: new Date().toISOString().slice(0, 10), fontes,
  calculo: 'Cálculo do StatWorld: beneficiários de planos de assistência médica (sem os só odontológicos), pelo município de residência do contrato, ÷ população estimada pelo IBGE. Uma pessoa com dois planos conta duas vezes.' };
const dir = new URL('../../dados/saude/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('brasil-planos.json', dir), JSON.stringify({ _explicacao: 'Saúde: planos de saúde, Brasil (BR) e estados. Gerado por scripts/saude-planos/baixar.mjs. Não edite à mão.', ...comum, valores: estSaida }, null, 1));
await writeFile(new URL(`brasil-${uf2}-planos.json`, dir), JSON.stringify({ _explicacao: `Saúde: planos de saúde, municípios de ${UF}. Gerado por scripts/saude-planos/baixar.mjs. Não edite à mão.`, ...comum, valores: munSaida }));
console.log(`Pronto (${periodo}). Brasil: ${estSaida.BR.beneficiarios} beneficiários, ${estSaida.BR.pctPopulacao}% da população; ${UF}: ${estSaida[UF]?.pctPopulacao}%; ${porSeis.size} municípios.`);
