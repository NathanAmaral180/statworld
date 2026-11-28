// Pirâmide etária (Censo 2022) de cada município de um estado: homens e mulheres em 17 faixas de 5 anos (a última é 80+).
// Usada na ficha do município da Demografia (tela 12 do design da rodada 6).
// Fonte: IBGE, Censo Demográfico 2022, tabela 9514 do Sidra.
// Gera: dados/demografia/brasil-<uf>-piramides.json
// Como rodar (na pasta statworld):  node scripts/piramides-municipios/baixar.mjs
// Outro estado (PowerShell):        $env:UF="MG"; node scripts/piramides-municipios/baixar.mjs

import { writeFile } from 'node:fs/promises';

const UF = (process.env.UF ?? 'SP').toUpperCase();
const API = 'https://servicodados.ibge.gov.br/api/v3/agregados';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => (v === '-' ? 0 : v == null || v === '' || /^(X|\.\.\.?)$/.test(v) ? null : Number(v));
const GRUPOS = ['93070', '93084', '93085', '93086', '93087', '93088', '93089', '93090', '93091', '93092', '93093', '93094', '93095', '93096', '93097', '93098', '49108', '49109', '60040', '60041', '6653'];

const estado = (await (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).json()).find((e) => e.sigla === UF);
if (!estado) throw new Error(`Estado desconhecido: ${UF}`);
let resp = null;
for (let i = 1; i <= 6 && !resp; i++) {
  const r = await fetch(`${API}/9514/periodos/2022/variaveis/93?localidades=N6[N3[${estado.id}]]&classificacao=2[4,5]|287[${GRUPOS.join(',')}]|286[113635]`);
  if (r.ok) { const j = await r.json(); if (Array.isArray(j)) resp = j; }
  if (!resp) await espera(4000 * i);
}
if (!resp) throw new Error('O IBGE não respondeu (tabela 9514).');
const p = {}; // código -> {h:[21], m:[21]}
for (const v of resp) for (const res of v.resultados) {
  const [sexo, grupo] = res.classificacoes.slice(0, 2).map((c) => Object.keys(c.categoria)[0]);
  const i = GRUPOS.indexOf(grupo);
  for (const s of res.series) {
    const o = (p[s.localidade.id] ??= { h: Array(21).fill(null), m: Array(21).fill(null) });
    o[sexo === '4' ? 'h' : 'm'][i] = num(s.serie['2022']);
  }
}
const junta = (a) => (a.some((v) => v == null) ? null : [...a.slice(0, 16), a.slice(16).reduce((s, v) => s + v, 0)]);
const valores = Object.fromEntries(Object.entries(p).map(([c, o]) => { const h = junta(o.h), m = junta(o.m); return [c, h && m ? [h, m] : null]; }));
const saida = {
  _explicacao: `Pirâmide etária (Censo 2022) de cada município de ${estado.nome}: [homens[17], mulheres[17]], faixas de 5 anos e 80+. Gerado por scripts/piramides-municipios/baixar.mjs. Não edite à mão. null = sem dado.`,
  periodo: '2022', frequencia: 'censo', fontes: [{ nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 9514)', url: 'https://sidra.ibge.gov.br/tabela/9514' }],
  baixadoEm: new Date().toISOString().slice(0, 10), valores,
};
await writeFile(new URL(`../../dados/demografia/brasil-${UF.toLowerCase()}-piramides.json`, import.meta.url), JSON.stringify(saida));
const n = Object.keys(valores).length, c = valores[Object.keys(valores)[0]];
console.log(`Pronto: ${n} municípios de ${estado.nome}; exemplo: ${c ? c[0].reduce((a, b) => a + b, 0) + c[1].reduce((a, b) => a + b, 0) : 'sem dado'} pessoas.`);
