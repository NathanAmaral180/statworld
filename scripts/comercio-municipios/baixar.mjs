// Exportações e importações de cada município de um estado (Comex Stat, Secex/MDIC, API oficial).
// No Comex Stat, o município é o domicílio fiscal da empresa que exportou ou importou
// (não é necessariamente onde o produto foi feito).
// Mede: o ano em curso (janeiro até o último mês com dado), o mesmo período do ano anterior e o último ano completo.
// Valores em dólares (FOB). A data vem do próprio Comex Stat ("dados atualizados em").
// Gera: dados/comercio/brasil-<uf>-municipios.json
// Como rodar (na pasta statworld):  node scripts/comercio-municipios/baixar.mjs
// Outro estado (PowerShell):        $env:UF="MG"; node scripts/comercio-municipios/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const UF = (process.env.UF ?? 'SP').toUpperCase();
const API = 'https://api-comexstat.mdic.gov.br';
const IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url, opcoes) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const r = await fetch(url, opcoes);
    if (r.ok) return r.json();
    await espera(3000 * tentativa); // a API limita pedidos seguidos: espera e tenta de novo
  }
  throw new Error(`Sem resposta de ${url}`);
}
const consulta = async (corpo) => {
  const j = await json(`${API}/cities?language=pt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  if (!j.success || !j.data?.list) throw new Error(`O Comex Stat recusou a consulta ${JSON.stringify(corpo)}`);
  return j.data.list;
};

// Estado: código do IBGE e código próprio do Comex Stat (são diferentes).
const estados = await json(`${IBGE}/estados`);
const estado = estados.find((e) => e.sigla === UF);
if (!estado) throw new Error(`Estado desconhecido: ${UF}`);
const ufsComex = (await json(`${API}/cities/filters/state?language=pt`)).data[0];
const idComex = ufsComex.find((x) => x.text === estado.nome)?.id;
if (!idComex) throw new Error(`Estado ${estado.nome} não encontrado no Comex Stat.`);

// Municípios: o Comex Stat usa códigos próprios e devolve o nome ("Campinas - SP"). Junta pelo nome com o IBGE.
const normal = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const municipios = await json(`${IBGE}/estados/${estado.id}/municipios`);
const codigoPorNome = new Map(municipios.map((m) => [normal(m.nome), String(m.id)]));
// Nomes antigos que o Comex Stat ainda usa (nome do Comex → nome atual no IBGE). Acrescente aqui se o script avisar.
const APELIDOS = { Embu: "Embu das Artes" };
for (const [velho, novo] of Object.entries(APELIDOS)) if (codigoPorNome.has(normal(novo))) codigoPorNome.set(normal(velho), codigoPorNome.get(normal(novo)));

// Período: último mês com dado e data da atualização.
const atual = (await json(`${API}/general/dates/updated`)).data;
const ano = Number(atual.year), mes = Number(atual.monthNumber);
const mm = String(mes).padStart(2, '0');
const anoFechado = mes === 12 ? ano : ano - 1;

const semNome = new Set();
async function porMunicipio(fluxo, de, ate) {
  const lista = await consulta({ flow: fluxo, monthDetail: false, period: { from: de, to: ate }, filters: [{ filter: 'state', values: [Number(idComex)] }], details: ['city'], metrics: ['metricFOB'] });
  await espera(1500);
  // Todo município do estado começa com 0: o Comex Stat não lista quem não exportou/importou nada no período.
  const valores = Object.fromEntries(municipios.map((m) => [String(m.id), 0]));
  for (const l of lista) {
    const nome = l.noMunMinsgUf.replace(new RegExp(`\\s*-\\s*${UF}$`), '');
    const cod = codigoPorNome.get(normal(nome));
    if (cod) valores[cod] = Number(l.metricFOB);
    else semNome.add(nome);
  }
  return valores;
}

const deAno = `${ano}-01`, ateAno = `${ano}-${mm}`;
const deAnt = `${ano - 1}-01`, ateAnt = `${ano - 1}-${mm}`;
const exportNoAno = await porMunicipio('export', deAno, ateAno);
const importNoAno = await porMunicipio('import', deAno, ateAno);
const exportAnoAnterior = await porMunicipio('export', deAnt, ateAnt);
const exportFechado = await porMunicipio('export', `${anoFechado}-01`, `${anoFechado}-12`);
if (semNome.size) console.log(`Atenção: ${semNome.size} nomes do Comex Stat sem município do IBGE: ${[...semNome].join(', ')}`);

const periodoNoAno = mes === 1 ? `janeiro de ${ano}` : `janeiro a ${MESES[mes - 1]} de ${ano}`;
const fonte = (publicacao) => ({ nome: 'Secex/MDIC', publicacao, url: 'https://comexstat.mdic.gov.br', dataAtualizacao: atual.updated });
// Variação só quando há base: município que não exportou no ano anterior fica "sem dado" (não dá para dividir por zero).
const variacao = Object.fromEntries(Object.keys(exportNoAno).map((c) => {
  const a = exportAnoAnterior[c], b = exportNoAno[c];
  return [c, a > 0 ? Math.round(((b / a - 1) * 100) * 10) / 10 : null];
}));
const soma = (v) => Object.values(v).reduce((s, x) => s + x, 0);

const indicadores = {
  'exportacoes-no-ano': {
    nome: 'Exportações no ano', unidade: 'USD', periodo: periodoNoAno, frequencia: 'mensal',
    fontes: [fonte(`Comex Stat, exportações por município, ${periodoNoAno}`)],
    calculo: 'Valor publicado pelo Comex Stat (US$ FOB), pelo município do domicílio fiscal da empresa exportadora.',
    valores: exportNoAno, valorEstado: soma(exportNoAno),
  },
  'importacoes-no-ano': {
    nome: 'Importações no ano', unidade: 'USD', periodo: periodoNoAno, frequencia: 'mensal',
    fontes: [fonte(`Comex Stat, importações por município, ${periodoNoAno}`)],
    calculo: 'Valor publicado pelo Comex Stat (US$ FOB), pelo município do domicílio fiscal da empresa importadora.',
    valores: importNoAno, valorEstado: soma(importNoAno),
  },
  'exportacoes-variacao': {
    nome: `Exportações: variação sobre ${periodoNoAno.replace(String(ano), String(ano - 1))}`, unidade: '%', periodo: periodoNoAno, frequencia: 'mensal',
    fontes: [fonte(`Comex Stat, exportações por município, ${periodoNoAno} e mesmo período de ${ano - 1}`)],
    calculo: 'Cálculo do StatWorld: exportações no ano ÷ exportações no mesmo período do ano anterior − 1, em dólares correntes. Sem dado quando o município não exportou no ano anterior.',
    valores: variacao,
  },
  'exportacoes-ano-fechado': {
    nome: 'Exportações', unidade: 'USD', periodo: String(anoFechado), frequencia: 'anual',
    fontes: [fonte(`Comex Stat, exportações por município, ${anoFechado}`)],
    calculo: 'Valor publicado pelo Comex Stat (US$ FOB), pelo município do domicílio fiscal da empresa exportadora.',
    valores: exportFechado, valorEstado: soma(exportFechado),
  },
};

const arquivo = `brasil-${UF.toLowerCase()}-municipios`;
const SAIDA = new URL(`../../dados/comercio/${arquivo}.json`, import.meta.url);
const saida = {
  _explicacao: `Exportações e importações dos municípios de ${estado.nome} (US$, FOB). Chave = código do município no IBGE. Gerado por scripts/comercio-municipios/baixar.mjs. Não edite à mão. 0 = o Comex Stat não registrou operação no período (diferente de null = sem dado).`,
  pais: 'BR', estado: UF, nivel: 'municipio', periodo: periodoNoAno,
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores,
  aviso: "A soma dos municípios não é igual ao total do estado na aba Comércio exterior: aqui conta o município onde fica a empresa (domicílio fiscal); no total por estado, o Comex Stat conta o estado de onde saiu o produto.",
};
await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 1));
const bi = (v) => (v / 1e9).toFixed(2).replace('.', ',');
console.log(`Pronto: ${municipios.length} municípios de ${estado.nome}. Exportações ${periodoNoAno}: US$ ${bi(indicadores['exportacoes-no-ano'].valorEstado)} bi; ${anoFechado}: US$ ${bi(indicadores['exportacoes-ano-fechado'].valorEstado)} bi.`);
