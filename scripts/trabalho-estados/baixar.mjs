// Baixa do IBGE (PNAD Contínua) o desemprego e a renda média do trabalho:
//  - por estado, no trimestre mais recente (tabelas 4099 e 5436 do Sidra);
//  - do Brasil, mês a mês desde 2012 (trimestre móvel: tabelas 6381 e 6390), para os gráficos de série.
// A data de divulgação vem do próprio IBGE (campo "modificacao" de cada período).
// Gera: dados/trabalho/brasil-estados.json e dados/trabalho/brasil-series.json
// Como rodar (na pasta statworld):  node scripts/trabalho-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const API = 'https://servicodados.ibge.gov.br/api/v3/agregados';
const SAIDA_ESTADOS = new URL('../../dados/trabalho/brasil-estados.json', import.meta.url);
const SAIDA_SERIES = new URL('../../dados/trabalho/brasil-series.json', import.meta.url);
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';

async function baixar(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${url}`);
  return r.json();
}
// "18/11/2026" -> "2026-11-18"
const isoDe = (d) => (d ? d.split('/').reverse().join('-') : null);
// Valor do Sidra: número, ou null quando vem "...", "-", "X" etc. ("sem dado", nunca zero).
const num = (v) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null);

const estados = await baixar(URL_ESTADOS);
const siglaPorCodigo = new Map(estados.map((e) => [String(e.id), e.sigla]));
const siglas = estados.map((e) => e.sigla).sort();

// Último período de uma tabela e a data em que o IBGE o divulgou.
async function ultimoPeriodo(tabela) {
  const ps = await baixar(`${API}/${tabela}/periodos`);
  const p = ps.at(-1);
  return { id: p.id, nome: p.literals[0], divulgacao: isoDe(p.modificacao), todos: ps };
}

// Valores por estado (N3) e do Brasil (N1) num período.
async function porEstado(tabela, variavel, periodo, classificacao = '') {
  const url = `${API}/${tabela}/periodos/${periodo}/variaveis/${variavel}?localidades=N3%5Ball%5D%7CN1%5Ball%5D${classificacao}`;
  const [res] = await baixar(url);
  const valores = Object.fromEntries(siglas.map((s) => [s, null]));
  let pais = null;
  for (const s of res.resultados[0].series) {
    const v = num(s.serie[periodo]);
    if (s.localidade.nivel.id === 'N1') pais = v;
    else valores[siglaPorCodigo.get(s.localidade.id)] = v;
  }
  return { valores, pais };
}

// ---- Por estado: trimestre mais recente ----
const pDes = await ultimoPeriodo(4099);
const pRen = await ultimoPeriodo(5436);
if (pDes.id !== pRen.id) throw new Error(`Desemprego (${pDes.id}) e renda (${pRen.id}) estão em trimestres diferentes. Rode de novo mais tarde.`);
const desemprego = await porEstado(4099, 4099, pDes.id);
const renda = await porEstado(5436, 5933, pRen.id, '&classificacao=2%5B6794%5D'); // 2[6794] = sexo: total

const fonte = (tabela, publicacao, divulgacao) => ({
  nome: 'IBGE',
  publicacao,
  url: `https://sidra.ibge.gov.br/tabela/${tabela}`,
  dataDivulgacao: divulgacao,
});
const trimestre = pDes.nome; // ex.: "3º trimestre 2026"

const estadosSaida = {
  _explicacao: 'Desemprego e renda por estado (PNAD Contínua). Gerado por scripts/trabalho-estados/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR',
  nivel: 'estado',
  periodo: trimestre,
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: {
    desemprego: {
      nome: 'Taxa de desemprego',
      unidade: '%',
      periodo: trimestre,
      frequencia: 'trimestral',
      fontes: [fonte(4099, `PNAD Contínua, ${trimestre} (tabela 4099 do Sidra)`, pDes.divulgacao)],
      calculo: 'Valor publicado pelo IBGE: parcela das pessoas de 14 anos ou mais que procuraram trabalho e não encontraram, entre as que estão na força de trabalho.',
      valorPais: desemprego.pais,
      valores: desemprego.valores,
    },
    renda: {
      nome: 'Renda média do trabalho, por mês',
      unidade: 'moeda',
      periodo: trimestre,
      frequencia: 'trimestral',
      fontes: [fonte(5436, `PNAD Contínua, ${trimestre} (tabela 5436 do Sidra)`, pRen.divulgacao)],
      calculo: 'Valor publicado pelo IBGE: rendimento médio mensal real habitualmente recebido em todos os trabalhos, pessoas ocupadas de 14 anos ou mais. "Real" = corrigido pela inflação até o trimestre mais recente.',
      valorPais: renda.pais,
      valores: renda.valores,
    },
  },
};

// ---- Brasil, mês a mês (trimestre móvel) desde 2012 ----
async function serieBrasil(tabela, variavel) {
  const ps = await baixar(`${API}/${tabela}/periodos`);
  const ids = ps.map((p) => p.id).join('|');
  const [res] = await baixar(`${API}/${tabela}/periodos/${ids}/variaveis/${variavel}?localidades=N1%5Ball%5D`);
  const serie = res.resultados[0].series[0].serie;
  return {
    divulgacao: isoDe(ps.at(-1).modificacao),
    ultimo: ps.at(-1).literals[0],
    pontos: ps.map((p) => ({ periodo: p.id, nome: p.literals[0], valor: num(serie[p.id]) })),
  };
}
const sDes = await serieBrasil(6381, 4099);
const sRen = await serieBrasil(6390, 5933);

const seriesSaida = {
  _explicacao: 'Desemprego e renda do Brasil, mês a mês (trimestre móvel: cada ponto é a média dos 3 meses que terminam naquele mês). Gerado por scripts/trabalho-estados/baixar.mjs. Não edite à mão.',
  pais: 'BR',
  baixadoEm: new Date().toISOString().slice(0, 10),
  series: {
    desemprego: {
      nome: 'Taxa de desemprego, %',
      unidade: '%',
      frequencia: 'mensal',
      fontes: [fonte(6381, `PNAD Contínua mensal, até ${sDes.ultimo} (tabela 6381 do Sidra)`, sDes.divulgacao)],
      pontos: sDes.pontos,
    },
    renda: {
      nome: 'Renda média do trabalho, R$ por mês',
      unidade: 'moeda',
      frequencia: 'mensal',
      observacao: `Valores corrigidos pela inflação até ${sRen.ultimo}.`,
      fontes: [fonte(6390, `PNAD Contínua mensal, até ${sRen.ultimo} (tabela 6390 do Sidra)`, sRen.divulgacao)],
      pontos: sRen.pontos,
    },
  },
};

await mkdir(new URL('.', SAIDA_ESTADOS), { recursive: true });
await writeFile(SAIDA_ESTADOS, JSON.stringify(estadosSaida, null, 2));
await writeFile(SAIDA_SERIES, JSON.stringify(seriesSaida, null, 2));
const semDado = [desemprego, renda].flatMap((x) => Object.values(x.valores)).filter((v) => v === null).length;
console.log(`Pronto: ${trimestre} (divulgado em ${pDes.divulgacao}); série mensal até ${sDes.ultimo}.`);
console.log(`Brasil: desemprego ${desemprego.pais}%, renda R$ ${renda.pais}. ${semDado ? semDado + ' valores sem dado.' : 'Nenhum valor sem dado.'}`);
