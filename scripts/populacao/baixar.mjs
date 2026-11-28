// Tema Demografia: população, crescimento, densidade e idade do Brasil, dos estados e de todos os municípios (IBGE, Sidra).
//  - Censo 2022: população, variação desde 2010 e taxa de crescimento por ano (tabela 4709); área e densidade (4714);
//    população por sexo e grupo de idade de 5 anos (9514) → pirâmide etária e medidas de idade.
//  - Estimativas de população (6579): os dois anos mais recentes (crescimento entre eles).
// Gera: dados/demografia/brasil-estados.json (Brasil + 27 estados, com pirâmides)
//       dados/demografia/brasil-municipios.json (5.570 municípios; pirâmide resumida em medidas de idade)
// Como rodar (na pasta statworld):  node scripts/populacao/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const API = 'https://servicodados.ibge.gov.br/api/v3/agregados';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function sidra(caminho) {
  for (let i = 1; i <= 5; i++) {
    const r = await fetch(`${API}/${caminho}`);
    if (r.ok) { const j = await r.json(); if (Array.isArray(j)) return j; }
    await espera(3000 * i);
  }
  throw new Error(`O IBGE não respondeu: ${API}/${caminho}`);
}
// No Sidra, "-" é zero absoluto; "X" (sigilo), ".." e "..." (não se aplica / não disponível) são sem dado.
const num = (v) => (v === '-' ? 0 : v == null || v === '' || /^(X|\.\.\.?)$/.test(v) ? null : Number(v));
// Lê uma resposta do Sidra em { variavel: { localidade: valor } } (sem classificação) ou com chave da categoria.
function porLocal(resp, ano) {
  const out = {};
  for (const v of resp) {
    for (const res of v.resultados) {
      const cat = res.classificacoes.map((c) => Object.keys(c.categoria)[0]).join('|');
      for (const s of res.series) {
        const k = cat ? `${v.id}|${cat}` : v.id;
        ((out[k] ??= {})[s.localidade.id] = num(s.serie[ano]));
      }
    }
  }
  return out;
}

const estados = await (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).json();
const siglaDe = Object.fromEntries(estados.map((e) => [String(e.id), e.sigla]));
const LOCAIS = ['N1[all]', 'N3[all]'];

// ---------- 1. Censo 2022 e estimativas ----------
console.log('Censo 2022: população, crescimento, área e densidade...');
const censoPop = async (loc) => porLocal(await sidra(`4709/periodos/2022/variaveis/93|5936|10605?localidades=${loc}`), '2022');
const censoArea = async (loc) => porLocal(await sidra(`4714/periodos/2022/variaveis/6318|614?localidades=${loc}`), '2022');
const periodosEst = (await (await fetch(`${API}/6579/periodos`)).json()).map((p) => p.id).sort();
const [anoEstAnt, anoEst] = periodosEst.slice(-2);
const dataEst = (await (await fetch(`${API}/6579/periodos`)).json()).find((p) => p.id === anoEst).modificacao; // dd/mm/aaaa
console.log(`Estimativas: ${anoEstAnt} e ${anoEst} (atualizada em ${dataEst}).`);
const estim = async (loc, ano) => porLocal(await sidra(`6579/periodos/${ano}/variaveis/9324?localidades=${loc}`), ano)['9324'] ?? {};

// ---------- 2. Idade (pirâmide) ----------
const GRUPOS = { 93070: '0–4', 93084: '5–9', 93085: '10–14', 93086: '15–19', 93087: '20–24', 93088: '25–29', 93089: '30–34', 93090: '35–39', 93091: '40–44', 93092: '45–49', 93093: '50–54', 93094: '55–59', 93095: '60–64', 93096: '65–69', 93097: '70–74', 93098: '75–79', 49108: '80–84', 49109: '85–89', 60040: '90–94', 60041: '95–99', 6653: '100+' };
// Ordem das idades (não use Object.keys(GRUPOS): o JavaScript põe chaves numéricas em ordem de número, e os códigos do IBGE não seguem a idade).
const idsGrupos = ['93070', '93084', '93085', '93086', '93087', '93088', '93089', '93090', '93091', '93092', '93093', '93094', '93095', '93096', '93097', '93098', '49108', '49109', '60040', '60041', '6653'];
async function idade(loc) {
  const r = porLocal(await sidra(`9514/periodos/2022/variaveis/93?localidades=${loc}&classificacao=2[4,5]|287[${idsGrupos.join(',')}]|286[113635]`), '2022');
  const out = {}; // local -> { homens: [21], mulheres: [21] }
  for (const [k, vals] of Object.entries(r)) {
    const [, sexo, grupo] = k.split('|');
    const i = idsGrupos.indexOf(grupo);
    for (const [loc, v] of Object.entries(vals)) {
      const o = (out[loc] ??= { homens: Array(21).fill(null), mulheres: Array(21).fill(null) });
      o[sexo === '4' ? 'homens' : 'mulheres'][i] = v;
    }
  }
  return out;
}
// Medidas de idade a partir da pirâmide (cálculo do StatWorld).
function medidasIdade(p) {
  if (!p || p.homens.some((v) => v == null) || p.mulheres.some((v) => v == null)) return null;
  const t = p.homens.map((h, i) => h + p.mulheres[i]);
  const soma = (a, b) => t.slice(a, b).reduce((s, v) => s + v, 0);
  const total = soma(0, 21);
  if (!total) return null;
  const criancas = soma(0, 3), idosos60 = soma(12, 21), idosos65 = soma(13, 21);
  // Idade mediana aproximada: interpolação dentro do grupo de 5 anos onde está a metade da população.
  let acum = 0, mediana = null;
  for (let i = 0; i < 21; i++) { if (acum + t[i] >= total / 2) { mediana = i * 5 + ((total / 2 - acum) / t[i]) * 5; break; } acum += t[i]; }
  const r1 = (n) => Math.round(n * 10) / 10;
  return {
    criancas: r1((criancas / total) * 100), // % de 0 a 14 anos
    idosos: r1((idosos60 / total) * 100), // % de 60 anos ou mais
    idosos65: r1((idosos65 / total) * 100),
    envelhecimento: criancas ? r1((idosos65 / criancas) * 100) : null, // como o IBGE: pessoas de 65+ para cada 100 crianças (0–14)
    mediana: mediana == null ? null : r1(mediana),
    homensPor100Mulheres: r1((p.homens.reduce((a, b) => a + b, 0) / p.mulheres.reduce((a, b) => a + b, 0)) * 100),
  };
}

const fonteCenso = (tabela, publicacao) => ({ nome: 'IBGE', publicacao, url: `https://sidra.ibge.gov.br/tabela/${tabela}`, dataDivulgacao: null });
const [d, m, a] = dataEst.split('/');
const FONTES = {
  censo: fonteCenso(4709, 'Censo Demográfico 2022 (tabela 4709)'),
  area: fonteCenso(4714, 'Censo Demográfico 2022 (tabela 4714)'),
  idade: fonteCenso(9514, 'Censo Demográfico 2022 (tabela 9514)'),
  estimativa: { nome: 'IBGE', publicacao: `Estimativas da População ${anoEst} (tabela 6579)`, url: 'https://sidra.ibge.gov.br/tabela/6579', dataAtualizacao: `${a}-${m}-${d}` },
};

function montar(chaves, pop, area, estA, estB, idades, nomeChave) {
  const r1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
  const ind = (nome, unidade, fontes, valores, extra = {}) => ({ nome, unidade, fontes, valores, ...extra });
  const pegar = (obj, k) => obj?.[k] ?? null;
  const v = (f) => Object.fromEntries(chaves.map((k) => [nomeChave(k), f(k)]));
  return {
    populacao: ind('População (Censo 2022)', 'pessoas', [FONTES.censo], v((k) => pegar(pop['93'], k)), { periodo: '2022', frequencia: 'censo' }),
    'variacao-2010': ind('Variação da população desde 2010', 'pessoas', [FONTES.censo], v((k) => pegar(pop['5936'], k)), { periodo: '2010–2022', frequencia: 'censo', calculo: 'Publicado pelo IBGE, com a população de 2010 compatibilizada com os limites atuais.' }),
    'crescimento-ano': ind('Crescimento da população por ano (2010–2022)', '%', [FONTES.censo], v((k) => pegar(pop['10605'], k)), { periodo: '2010–2022', frequencia: 'censo', calculo: 'Taxa de crescimento geométrico publicada pelo IBGE.' }),
    area: ind('Área', 'km²', [FONTES.area], v((k) => pegar(area['6318'], k)), { periodo: '2022', frequencia: 'censo' }),
    densidade: ind('Densidade demográfica', 'hab/km²', [FONTES.area], v((k) => pegar(area['614'], k)), { periodo: '2022', frequencia: 'censo' }),
    estimativa: ind(`População estimada ${anoEst}`, 'pessoas', [FONTES.estimativa], v((k) => pegar(estB, k)), { periodo: anoEst, frequencia: 'estimativa' }),
    'estimativa-anterior': ind(`População estimada ${anoEstAnt}`, 'pessoas', [FONTES.estimativa], v((k) => pegar(estA, k)), { periodo: anoEstAnt, frequencia: 'estimativa' }),
    'crescimento-estimativa': ind(`Crescimento da população de ${anoEstAnt} para ${anoEst}`, '%', [FONTES.estimativa], v((k) => (estA?.[k] && estB?.[k] != null ? r1((estB[k] / estA[k] - 1) * 100) : null)), { periodo: `${anoEstAnt}–${anoEst}`, frequencia: 'estimativa', calculo: 'Cálculo do StatWorld com as duas estimativas do IBGE.' }),
    ...Object.fromEntries(['criancas', 'idosos', 'idosos65', 'envelhecimento', 'mediana', 'homensPor100Mulheres'].map((m) => [`idade-${m}`, ind(
      { criancas: 'Crianças (0 a 14 anos)', idosos: 'Idosos (60 anos ou mais)', idosos65: 'Idosos (65 anos ou mais)', envelhecimento: 'Índice de envelhecimento (pessoas de 65 anos ou mais para cada 100 de 0 a 14, como o IBGE)', mediana: 'Idade mediana (aproximada)', homensPor100Mulheres: 'Homens para cada 100 mulheres' }[m],
      m === 'mediana' ? 'anos' : m === 'envelhecimento' || m === 'homensPor100Mulheres' ? 'razão' : '%', [FONTES.idade],
      v((k) => medidasIdade(idades[k])?.[m] ?? null),
      { periodo: '2022', frequencia: 'censo', calculo: m === 'mediana' ? 'Cálculo do StatWorld: interpolação dentro do grupo de 5 anos em que está a metade da população (aproximação).' : 'Cálculo do StatWorld com a população por sexo e idade do Censo 2022.' },
    )])),
  };
}

// Brasil e estados
const [popUF, areaUF, estAUF, estBUF, idUF] = [
  await censoPop(LOCAIS.join('|')), await censoArea(LOCAIS.join('|')),
  await estim(LOCAIS.join('|'), anoEstAnt), await estim(LOCAIS.join('|'), anoEst), await idade(LOCAIS.join('|')),
];
const chavesUF = Object.keys(siglaDe);
const saidaEstados = {
  _explicacao: 'Demografia do Brasil e dos estados (chave = sigla; BR = Brasil). Gerado por scripts/populacao/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR', nivel: 'estado', baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: montar(['1', ...chavesUF], popUF, areaUF, estAUF, estBUF, idUF, (k) => (k === '1' ? 'BR' : siglaDe[k])),
  piramides: {
    _explicacao: 'População por sexo e grupo de 5 anos de idade (Censo 2022). grupos[i] vale para homens[i] e mulheres[i].',
    fontes: [FONTES.idade], periodo: '2022', grupos: idsGrupos.map((id) => GRUPOS[id]),
    valores: Object.fromEntries(['1', ...chavesUF].map((k) => [k === '1' ? 'BR' : siglaDe[k], idUF[k] ?? null])),
  },
};

// Municípios (por estado, para não pedir tudo de uma vez ao IBGE)
console.log('Municípios, estado por estado...');
let popM = {}, areaM = {}, estAM = {}, estBM = {}, idM = {};
const juntar = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = { ...(a[k] ?? {}), ...v }; return a; };
for (const uf of chavesUF) {
  const loc = `N6[N3[${uf}]]`;
  juntar(popM, await censoPop(loc)); juntar(areaM, await censoArea(loc));
  Object.assign(estAM, await estim(loc, anoEstAnt)); Object.assign(estBM, await estim(loc, anoEst));
  Object.assign(idM, await idade(loc));
  process.stdout.write(`${siglaDe[uf]} `);
  await espera(300);
}
console.log('');
const chavesM = Object.keys(popM['93'] ?? {}).sort();
if (chavesM.length < 5500) throw new Error(`Vieram só ${chavesM.length} municípios: confira as consultas ao IBGE.`);
const saidaMun = {
  _explicacao: 'Demografia de todos os municípios do Brasil (chave = código do IBGE). Gerado por scripts/populacao/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR', nivel: 'municipio', baixadoEm: saidaEstados.baixadoEm,
  indicadores: montar(chavesM, popM, areaM, estAM, estBM, idM, (k) => k),
};

const dir = new URL('../../dados/demografia/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('brasil-estados.json', dir), JSON.stringify(saidaEstados, null, 1));
await writeFile(new URL('brasil-municipios.json', dir), JSON.stringify(saidaMun));
const br = saidaEstados.indicadores;
console.log(`Pronto: Brasil ${br.populacao.valores.BR} pessoas no Censo 2022, ${br.estimativa.valores.BR} estimadas em ${anoEst}; ${chavesM.length} municípios.`);
