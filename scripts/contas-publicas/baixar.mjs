// Aba "Contas públicas". Prepara:
//  1. "De onde vem e para onde vai cada R$ 100" do governo federal (governo central) no último ano completo,
//     com o Resultado do Tesouro Nacional (RTN, planilha "Série Histórica - Mensal", tabela 1.1, Tesouro Transparente).
//  2. Dívida bruta do governo geral (% do PIB), mês a mês desde 2008 (Banco Central, SGS 13762).
//  3. Gasto do governo central por função, classificação internacional COFOG (Tesouro Transparente), último ano publicado.
// Gera: dados/contas-publicas/brasil-r100.json, brasil-divida.json, brasil-cofog.json
// Como rodar (na pasta statworld):  node scripts/contas-publicas/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx');

const CKAN = 'https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show?id=';
const PASTA = new URL('../../dados/contas-publicas/', import.meta.url);
const hoje = new Date().toLocaleDateString('sv-SE');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function baixar(url, tipo = 'json') {
  for (let t = 1; t <= 4; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (r.ok) return tipo === 'json' ? r.json() : Buffer.from(await r.arrayBuffer());
    await espera(2000 * t);
  }
  throw new Error(`Não consegui baixar ${url}`);
}

// As partes do Tesouro (1 e 3) mudam uma vez por ano. Se o site do Tesouro Transparente não responder
// (acontece com computadores fora do Brasil, como os da rotina automática), os arquivos delas ficam como estão
// e o script segue com a dívida (Banco Central).
const avisos = [];
async function tentar(nome, fn) {
  try { return await fn(); } catch (e) { avisos.push(`Atenção: ${nome} não foi atualizado (${e.message ?? e}); o arquivo anterior foi mantido.`); return null; }
}

const p1 = await tentar('"Cada R$ 100" (Tesouro)', async () => {
  // ---------- 1. Cada R$ 100 (RTN) ----------
  // Grupos do StatWorld, feitos com as linhas oficiais da tabela 1.1 do RTN (ver o LEIA-ME).
  const ENTRADAS = [
    { id: 'consumo', rotulo: 'Impostos sobre consumo e operações', inclui: 'Cofins, PIS/Pasep, IPI, IOF, Imposto de Importação e Cide', linhas: [/^1\.1\.01/, /^1\.1\.02/, /^1\.1\.04/, /^1\.1\.05/, /^1\.1\.06/, /^1\.1\.09/], cor: 'p-leite' },
    { id: 'renda', rotulo: 'Impostos sobre renda e lucro', inclui: 'Imposto de Renda e CSLL', linhas: [/^1\.1\.03/, /^1\.1\.07/], cor: 'p-soja' },
    { id: 'previdencia', rotulo: 'Contribuições à Previdência (INSS)', inclui: 'Arrecadação líquida para o Regime Geral de Previdência Social', linhas: [/^1\.3 /], cor: 'p-milho' },
    { id: 'outras', rotulo: 'Outras receitas', inclui: 'Royalties, dividendos de estatais, concessões, outras receitas da Receita Federal', linhas: [/^1\.1\.10/, /^1\.2 /, /^1\.4 /], cor: 'p-gado' },
  ];
  const SAIDAS = [
    { id: 'inss', rotulo: 'Aposentadorias e pensões do INSS', inclui: 'Benefícios previdenciários do Regime Geral', linhas: [/^4\.1 /], cor: 'p-leite' },
    { id: 'juros', rotulo: 'Juros da dívida', inclui: 'Juros nominais do governo central', linhas: [/^9\. JUROS/], absoluto: true, cor: 'p-soja' },
    { id: 'repasses', rotulo: 'Repasses a estados e municípios', inclui: 'FPE, FPM, fundos constitucionais, royalties e outras partilhas de receita', linhas: [/^2\. TRANSF/], cor: 'p-milho' },
    { id: 'servidores', rotulo: 'Servidores', inclui: 'Salários, aposentadorias e encargos do pessoal federal', linhas: [/^4\.2 /], cor: 'p-gado' },
    { id: 'beneficios', rotulo: 'BPC, abono e seguro-desemprego', inclui: 'Benefício de Prestação Continuada (LOAS/RMV), abono salarial e seguro-desemprego', linhas: [/^4\.3\.01/, /^4\.3\.05/], cor: 'p-mandioca' },
    { id: 'ministerios', rotulo: 'Ministérios (custeio e investimento)', inclui: 'Despesas do Poder Executivo sujeitas à programação financeira, como Bolsa Família, saúde e educação', linhas: [/^4\.4 /], cor: 'p-cana' },
    { id: 'outras-obrigatorias', rotulo: 'Outras despesas obrigatórias', inclui: 'Precatórios, Fundeb, subsídios, Legislativo e Judiciário, entre outras', linhas: [/^4\.3 /], menos: ['beneficios'], cor: 'p-cafe' },
  ];

  const rtnPacote = (await baixar(CKAN + 'resultado-do-tesouro-nacional')).result;
  const rtnRec = rtnPacote.resources.find((r) => /S[ée]rie Hist[óo]rica - Mensal/i.test(r.name));
  const rtn = XLSX.read(await baixar(rtnRec.url, 'binario'), { type: 'buffer' });
  const t11 = XLSX.utils.sheet_to_json(rtn.Sheets['1.1'], { header: 1, defval: null });
  const cab = t11.find((l) => l[0] === 'Discriminação');
  const mesDe = (v) => { const d = XLSX.SSF.parse_date_code(v); return d ? `${d.y}-${String(d.m).padStart(2, '0')}` : null; };
  const meses = cab.map(mesDe);
  const ultimoMes = meses.filter(Boolean).sort().at(-1);
  const ano = Number(ultimoMes.slice(0, 4)) - (ultimoMes.endsWith('-12') ? 0 : 1); // último ano completo
  const colunas = meses.map((m, i) => [m, i]).filter(([m]) => m?.startsWith(String(ano))).map(([, i]) => i);
  if (colunas.length !== 12) throw new Error(`O RTN não tem os 12 meses de ${ano}.`);
  function somaLinha(re) {
    const l = t11.find((r) => typeof r[0] === 'string' && re.test(r[0].trim()));
    if (!l) throw new Error(`Não achei a linha ${re} na tabela 1.1 do RTN.`);
    return colunas.reduce((t, i) => t + (Number(l[i]) || 0), 0) * 1e6; // R$ milhões -> R$
  }
  const valorGrupo = (g, ja) => {
    let v = g.linhas.reduce((t, re) => t + somaLinha(re), 0);
    if (g.absoluto) v = Math.abs(v);
    for (const m of g.menos ?? []) v -= ja[m];
    return v;
  };
  const saidasV = {};
  for (const g of SAIDAS) saidasV[g.id] = valorGrupo(g, saidasV);
  const entradasV = {};
  for (const g of ENTRADAS) entradasV[g.id] = valorGrupo(g, entradasV);
  const totalSaidas = Object.values(saidasV).reduce((a, b) => a + b, 0);
  const totalEntradas = Object.values(entradasV).reduce((a, b) => a + b, 0);
  const novaDivida = totalSaidas - totalEntradas;
  const receitaTotal = somaLinha(/^1\. RECEITA TOTAL/);
  // Arredonda para quadradinhos que somam exatamente 100 (método do maior resto).
  function cem(valores, total) {
    const brutos = valores.map((v) => (v / total) * 100);
    const inteiros = brutos.map(Math.floor);
    let falta = 100 - inteiros.reduce((a, b) => a + b, 0);
    brutos.map((b, i) => [b - Math.floor(b), i]).sort((a, b) => b[0] - a[0]).slice(0, falta).forEach(([, i]) => inteiros[i]++);
    return inteiros;
  }
  const entradasLista = [...ENTRADAS.map((g) => ({ id: g.id, rotulo: g.rotulo, inclui: g.inclui, cor: g.cor, valor: entradasV[g.id] })),
    { id: 'nova-divida', rotulo: 'Nova dívida', inclui: 'O que faltou para pagar tudo: o governo pega emprestado', cor: 'p-mandioca', valor: novaDivida }];
  const saidasLista = SAIDAS.map((g) => ({ id: g.id, rotulo: g.rotulo, inclui: g.inclui, cor: g.cor, valor: saidasV[g.id] }));
  const qE = cem(entradasLista.map((x) => x.valor), totalSaidas);
  const qS = cem(saidasLista.map((x) => x.valor), totalSaidas);
  const rtnFonte = {
    nome: 'Tesouro Nacional',
    publicacao: `Resultado do Tesouro Nacional, série histórica (tabela 1.1), ano de ${ano}`,
    url: 'https://www.tesourotransparente.gov.br/ckan/dataset/resultado-do-tesouro-nacional',
    dataAtualizacao: (rtnRec.last_modified ?? rtnRec.created).slice(0, 10),
  };
  const r100 = {
    _explicacao: 'De onde vem e para onde vai cada R$ 100 do governo central (União, INSS e Banco Central) no ano. Gerado por scripts/contas-publicas/baixar.mjs. Não edite à mão.',
    pais: 'BR',
    baixadoEm: hoje,
    periodo: String(ano),
    frequencia: 'anual',
    fontes: [rtnFonte],
    calculo: `Cálculo do StatWorld com o RTN: gastos = despesa total + repasses a estados e municípios + juros nominais; receitas = receita total. "Nova dívida" é a diferença entre os dois. Cada lado é reduzido a R$ 100 (proporção do total de gastos) e arredondado para somar 100.`,
    totais: { gastos: totalSaidas, receitas: receitaTotal, novaDivida },
    entradas: entradasLista.map((x, i) => ({ ...x, de100: qE[i] })),
    saidas: saidasLista.map((x, i) => ({ ...x, de100: qS[i] })),
    conferencia: { resultadoPrimario: somaLinha(/^5\. RESULTADO PRIM/), despesaTotal: somaLinha(/^4\. DESPESA TOTAL/), receitaLiquida: somaLinha(/^3\. RECEITA L/) },
  };


  return { r100, ano, totalSaidas, receitaTotal, novaDivida };
});

// ---------- 2. Dívida bruta (% do PIB) ----------
const br = (d) => d.split('-').reverse().join('/');
const dividaBruta = (await baixar(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.13762/dados?formato=json&dataInicial=01/01/2008&dataFinal=${br(hoje)}`))
  .map((x) => ({ data: x.data.split('/').reverse().join('-'), valor: Number(x.valor) }))
  .filter((x) => Number.isFinite(x.valor));
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const nomeMes = (d) => `${MESES[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const divida = {
  _explicacao: 'Dívida bruta do governo geral, % do PIB, mês a mês. Gerado por scripts/contas-publicas/baixar.mjs. Não edite à mão.',
  pais: 'BR',
  baixadoEm: hoje,
  periodo: nomeMes(dividaBruta.at(-1).data),
  serie: {
    nome: 'Dívida bruta do governo geral, % do PIB',
    unidade: '%',
    frequencia: 'mensal',
    fontes: [{ nome: 'Banco Central do Brasil', publicacao: 'Dívida bruta do governo geral (% PIB), metodologia a partir de 2008 (série 13762 do SGS)', url: 'https://dadosabertos.bcb.gov.br/dataset/13762', dataConsulta: hoje }],
    pontos: dividaBruta.map((p) => ({ periodo: p.data.slice(0, 7), nome: nomeMes(p.data), valor: p.valor })),
  },
};


const p3 = await tentar('Gasto por função (Tesouro, COFOG)', async () => {
  // ---------- 3. Gasto por função (COFOG) ----------
  const NOMES_COFOG = {
    '701': 'Serviços públicos gerais', '702': 'Defesa', '703': 'Ordem pública e segurança', '704': 'Assuntos econômicos',
    '705': 'Proteção ambiental', '706': 'Habitação e serviços comunitários', '707': 'Saúde', '708': 'Lazer, cultura e religião',
    '709': 'Educação', '710': 'Proteção social',
  };
  // Dois grupos de "serviços públicos gerais" saem separados, por serem grandes e fáceis de entender (subclasses da própria COFOG).
  const SEPARADOS = { '7017': 'Juros e encargos da dívida pública', '7018': 'Transferências a estados e municípios' };
  const cofogPacote = (await baixar(CKAN + 'despesas-por-funcao-do-governo-central-classificacao-cofog')).result;
  const bases = cofogPacote.resources.filter((r) => /^Base COFOG \d{4}$/i.test(r.name)).sort((a, b) => a.name.localeCompare(b.name));
  const base = bases.at(-1);
  const anoCofog = base.name.match(/\d{4}/)[0];
  const texto = new TextDecoder('latin1').decode(await baixar(base.url, 'binario'));
  const linhas = texto.trim().split(/\r?\n/);
  const h = linhas[0].split(';');
  const iC = h.indexOf('CLASSIFICACAO COFOG'), iV = h.length - 1;
  if (iC < 0 || !/VALOR/.test(h[iV])) throw new Error('A base COFOG mudou de formato.');
  const porGrupo = {};
  let totalCofog = 0;
  for (const l of linhas.slice(1)) {
    const c = l.split(';');
    const v = Number(c[iV].replace(/\./g, '').replace(',', '.')) * 1e6; // a base vem em R$ milhões
    if (!Number.isFinite(v)) continue;
    const cod = c[iC];
    const chave = SEPARADOS[cod.slice(0, 4)] ? cod.slice(0, 4) : cod.slice(0, 3);
    porGrupo[chave] = (porGrupo[chave] ?? 0) + v;
    totalCofog += v;
  }
  const funcoes = Object.entries(porGrupo)
    .map(([k, v]) => ({ codigo: k, nome: SEPARADOS[k] ?? (k === '701' ? `${NOMES_COFOG[k]} (demais)` : NOMES_COFOG[k] ?? k), valor: v, parte: Math.round((v / totalCofog) * 10000) / 100 }))
    .sort((a, b) => b.valor - a.valor);
  const cofog = {
    _explicacao: 'Gasto do governo central por função (classificação internacional COFOG). Gerado por scripts/contas-publicas/baixar.mjs. Não edite à mão.',
    pais: 'BR',
    baixadoEm: hoje,
    periodo: anoCofog,
    total: totalCofog,
    frequencia: 'anual',
    fontes: [{ nome: 'Tesouro Nacional', publicacao: `Despesas por Função do Governo Central, classificação COFOG, ${anoCofog}`, url: 'https://www.tesourotransparente.gov.br/ckan/dataset/despesas-por-funcao-do-governo-central-classificacao-cofog', dataAtualizacao: cofogPacote.metadata_modified.slice(0, 10) }],
    funcoes,
  };


  return { cofog, anoCofog, totalCofog, funcoes };
});

await mkdir(PASTA, { recursive: true });
const tri = (v) => `R$ ${(v / 1e12).toFixed(3)} tri`;
if (p1) {
  await writeFile(new URL('brasil-r100.json', PASTA), JSON.stringify(p1.r100, null, 2));
  console.log(`Cada R$ 100 (${p1.ano}): gastos ${tri(p1.totalSaidas)}, receitas ${tri(p1.receitaTotal)}, nova dívida ${tri(p1.novaDivida)}.`);
  console.log(`  Conferência: resultado primário ${tri(p1.r100.conferencia.resultadoPrimario)}, despesa total ${tri(p1.r100.conferencia.despesaTotal)}, receita líquida ${tri(p1.r100.conferencia.receitaLiquida)}.`);
}
await writeFile(new URL('brasil-divida.json', PASTA), JSON.stringify(divida, null, 2));
console.log(`Dívida bruta: ${dividaBruta.at(-1).valor}% do PIB em ${divida.periodo}.`);
if (p3) {
  await writeFile(new URL('brasil-cofog.json', PASTA), JSON.stringify(p3.cofog, null, 2));
  console.log(`COFOG ${p3.anoCofog}: total ${tri(p3.totalCofog)}; maior: ${p3.funcoes[0].nome}.`);
}
for (const a of avisos) console.log(a);
