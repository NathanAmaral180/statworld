// Tema Demografia: "quem somos" e "onde moramos" no Censo 2022 (IBGE, Sidra), para o Brasil, os estados e todos os municípios.
//  - Cor ou raça (tabela 9605, Censo 2022): Branca, Preta, Amarela, Parda, Indígena (termos e ordem do IBGE).
//  - Pessoas indígenas (9718): total, em terras indígenas e fora delas.
//  - Pessoas quilombolas (9578): total, em territórios quilombolas e fora deles.
//  - Domicílios particulares permanentes ocupados, moradores e média de moradores (4712).
//  - População urbana e rural (9923).
// Gera: dados/demografia/brasil-estados-censo.json e dados/demografia/brasil-municipios-censo.json
// Como rodar (na pasta statworld):  node scripts/demografia-censo/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const API = 'https://servicodados.ibge.gov.br/api/v3/agregados';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function sidra(caminho) {
  for (let i = 1; i <= 6; i++) {
    const r = await fetch(`${API}/${caminho}`);
    if (r.ok) { const j = await r.json(); if (Array.isArray(j)) return j; }
    await espera(4000 * i);
  }
  throw new Error(`O IBGE não respondeu: ${API}/${caminho}`);
}
// No Sidra, "-" é zero absoluto; "X", ".." e "..." são sem dado.
const num = (v) => (v === '-' ? 0 : v == null || v === '' || /^(X|\.\.\.?)$/.test(v) ? null : Number(v));
// { "variavel|categoria|categoria": { local: valor } }
function ler(resp, ano = '2022') {
  const out = {};
  for (const v of resp) for (const res of v.resultados) {
    const cat = res.classificacoes.map((c) => Object.keys(c.categoria)[0]).join('|');
    const k = cat ? `${v.id}|${cat}` : v.id;
    for (const s of res.series) (out[k] ??= {})[s.localidade.id] = num(s.serie[ano]);
  }
  return out;
}

const CONSULTAS = {
  raca: '9605/periodos/2022/variaveis/93?classificacao=86[95251,2776,2777,2778,2779,2780]',
  indigenas: '9718/periodos/2022/variaveis/350?classificacao=1714[60024]|2661[32776,12869,12870]',
  quilombolas: '9578/periodos/2022/variaveis/4709?classificacao=2661[32776,60027,60028]',
  domicilios: '4712/periodos/2022/variaveis/381|382|5930',
  situacao: '9923/periodos/2022/variaveis/93?classificacao=1[6795,1,2]',
};
async function tudo(loc) {
  const r = {};
  for (const [k, c] of Object.entries(CONSULTAS)) { r[k] = ler(await sidra(`${c}${c.includes("?") ? "&" : "?"}localidades=${loc}`)); await espera(300); }
  return r;
}

// Arruma por lugar: { local: { raca: {total, branca, ...}, indigenas: {...}, ... } }
const RACA = { 95251: 'total', 2776: 'branca', 2777: 'preta', 2778: 'amarela', 2779: 'parda', 2780: 'indigena' };
function porLugar(r) {
  const lugares = new Set(Object.values(r).flatMap((x) => Object.values(x).flatMap((v) => Object.keys(v))));
  const out = {};
  for (const l of lugares) {
    const g = (bloco, chave) => r[bloco][chave]?.[l] ?? null;
    out[l] = {
      raca: Object.fromEntries(Object.entries(RACA).map(([id, n]) => [n, g('raca', `93|${id}`)])),
      indigenas: { total: g('indigenas', '350|60024|32776'), emTerras: g('indigenas', '350|60024|12869'), foraDeTerras: g('indigenas', '350|60024|12870') },
      quilombolas: { total: g('quilombolas', '4709|32776'), emTerritorios: g('quilombolas', '4709|60027'), foraDeTerritorios: g('quilombolas', '4709|60028') },
      domicilios: { ocupados: g('domicilios', '381'), moradores: g('domicilios', '382'), mediaMoradores: g('domicilios', '5930') },
      situacao: { total: g('situacao', '93|6795'), urbana: g('situacao', '93|1'), rural: g('situacao', '93|2') },
    };
  }
  return out;
}

const fontes = {
  raca: { nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 9605)', url: 'https://sidra.ibge.gov.br/tabela/9605' },
  indigenas: { nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 9718)', url: 'https://sidra.ibge.gov.br/tabela/9718' },
  quilombolas: { nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 9578)', url: 'https://sidra.ibge.gov.br/tabela/9578' },
  domicilios: { nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 4712)', url: 'https://sidra.ibge.gov.br/tabela/4712' },
  situacao: { nome: 'IBGE', publicacao: 'Censo Demográfico 2022 (tabela 9923)', url: 'https://sidra.ibge.gov.br/tabela/9923' },
};
const estados = await (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).json();
const sigla = Object.fromEntries(estados.map((e) => [String(e.id), e.sigla]));

console.log('Brasil e estados...');
const uf = porLugar(await tudo('N1[all]|N3[all]'));
const ufSaida = Object.fromEntries(Object.entries(uf).map(([k, v]) => [k === '1' ? 'BR' : sigla[k], v]));
console.log('Municípios, estado por estado...');
const mun = {};
for (const id of Object.keys(sigla)) {
  Object.assign(mun, porLugar(await tudo(`N6[N3[${id}]]`)));
  process.stdout.write(`${sigla[id]} `);
}
console.log('');
if (Object.keys(mun).length < 5500) throw new Error(`Vieram só ${Object.keys(mun).length} municípios.`);

// Indicadores prontos para o mapa (cálculo do StatWorld: parte de cada grupo na população do próprio Censo).
const pct = (a, b) => (a == null || !b ? null : Math.round((a / b) * 10000) / 100);
function indicadores(lugares) {
  const v = (f) => Object.fromEntries(Object.entries(lugares).map(([k, l]) => [k, f(l)]));
  const ind = (nome, unidade, fonte, valores, calculo) => ({ nome, unidade, periodo: '2022', frequencia: 'censo', fontes: [fontes[fonte]], calculo, valores });
  const out = {};
  for (const [k, n] of [['branca', 'Branca'], ['preta', 'Preta'], ['amarela', 'Amarela'], ['parda', 'Parda'], ['indigena', 'Indígena']]) {
    out[`raca-${k}`] = ind(`Cor ou raça: ${n} (% da população)`, '%', 'raca', v((l) => pct(l.raca[k], l.raca.total)), 'Cálculo do StatWorld: pessoas que se declararam desta cor ou raça ÷ população (Censo 2022).');
  }
  out['raca-preta-parda'] = ind('Pretos e pardos (% da população)', '%', 'raca', v((l) => pct(l.raca.preta == null || l.raca.parda == null ? null : l.raca.preta + l.raca.parda, l.raca.total)), 'Cálculo do StatWorld: pretos + pardos ÷ população. O IBGE soma os dois grupos como população negra.');
  out['indigenas-pct'] = ind('Pessoas indígenas (% da população)', '%', 'indigenas', v((l) => pct(l.indigenas.total, l.situacao.total)), 'Cálculo do StatWorld: pessoas indígenas (tabela 9718) ÷ população (tabela 9923).');
  out['indigenas'] = ind('Pessoas indígenas', 'pessoas', 'indigenas', v((l) => l.indigenas.total));
  out['indigenas-em-terras'] = ind('Indígenas que moram em terras indígenas (%)', '%', 'indigenas', v((l) => pct(l.indigenas.emTerras, l.indigenas.total)), 'Cálculo do StatWorld com a tabela 9718.');
  out['quilombolas-pct'] = ind('Pessoas quilombolas (% da população)', '%', 'quilombolas', v((l) => pct(l.quilombolas.total, l.situacao.total)), 'Cálculo do StatWorld: pessoas quilombolas (tabela 9578) ÷ população (tabela 9923).');
  out['quilombolas'] = ind('Pessoas quilombolas', 'pessoas', 'quilombolas', v((l) => l.quilombolas.total));
  out['moradores-por-domicilio'] = ind('Moradores por domicílio', 'pessoas', 'domicilios', v((l) => l.domicilios.mediaMoradores), 'Publicado pelo IBGE (média de moradores em domicílios particulares permanentes ocupados).');
  out['domicilios'] = ind('Domicílios ocupados', 'domicílios', 'domicilios', v((l) => l.domicilios.ocupados));
  out['urbana-pct'] = ind('População em área urbana (%)', '%', 'situacao', v((l) => pct(l.situacao.urbana, l.situacao.total)), 'Cálculo do StatWorld com a tabela 9923.');
  return out;
}

const base = {
  _explicacao: 'Censo 2022: cor ou raça (termos e ordem do IBGE), indígenas, quilombolas, domicílios e urbana × rural. Gerado por scripts/demografia-censo/baixar.mjs. Não edite à mão. null = sem dado; 0 = o IBGE registrou zero.',
  periodo: '2022', frequencia: 'censo', fontes, baixadoEm: new Date().toISOString().slice(0, 10),
};
const dir = new URL('../../dados/demografia/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('brasil-estados-censo.json', dir), JSON.stringify({ ...base, nivel: 'estado', lugares: ufSaida, indicadores: indicadores(ufSaida) }, null, 1));
await writeFile(new URL('brasil-municipios-censo.json', dir), JSON.stringify({ ...base, nivel: 'municipio', lugares: mun, indicadores: indicadores(mun) }));
const br = ufSaida.BR;
console.log(`Pronto. Brasil: parda ${br.raca.parda}, branca ${br.raca.branca}; indígenas ${br.indigenas.total}; quilombolas ${br.quilombolas.total}; urbana ${br.situacao.urbana}; ${Object.keys(mun).length} municípios.`);
