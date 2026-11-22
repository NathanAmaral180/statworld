// Baixa do IBGE a indústria por estado e por setor (Pesquisa Industrial Anual – Empresa):
// valor da transformação industrial (VTI) e pessoal ocupado.
// Gera: dados/industria/brasil-estados.json
// Como rodar (na pasta statworld):  node scripts/industria-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

// ---- O que muda a cada ano (confira no LEIA-ME) ----------------------------
const ANO = 2024;
// ----------------------------------------------------------------------------

const TABELA = 10457;
const URL_DADOS = `https://apisidra.ibge.gov.br/values/t/${TABELA}/n3/all/v/811,631/p/${ANO}/c12762/all`;
const URL_PERIODOS = `https://servicodados.ibge.gov.br/api/v3/agregados/${TABELA}/periodos`;
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const SAIDA = new URL('../../dados/industria/brasil-estados.json', import.meta.url);

// Divisão da CNAE (2 primeiros dígitos) -> [identificador = nome do ícone, nome curto, grupo]
const E = 'extrativa', T = 'transformacao';
const SETORES = {
  '05': ['extracao-carvao', 'Carvão mineral', E], '06': ['extracao-petroleo-gas', 'Petróleo e gás', E],
  '07': ['extracao-minerais-metalicos', 'Minerais metálicos', E], '08': ['extracao-minerais-nao-metalicos', 'Minerais não metálicos', E],
  '09': ['apoio-extracao', 'Apoio à extração', E],
  '10': ['alimentos', 'Alimentos', T], '11': ['bebidas', 'Bebidas', T], '12': ['produtos-do-fumo', 'Produtos do fumo', T],
  '13': ['texteis', 'Têxteis', T], '14': ['vestuario', 'Vestuário', T], '15': ['couro-calcados', 'Couro e calçados', T],
  '16': ['madeira', 'Madeira', T], '17': ['celulose-papel', 'Celulose e papel', T], '18': ['impressao', 'Impressão', T],
  '19': ['derivados-petroleo', 'Derivados de petróleo e biocombustíveis', T], '20': ['quimicos', 'Químicos', T],
  '21': ['farmaceuticos', 'Farmacêuticos', T], '22': ['borracha-plastico', 'Borracha e plástico', T],
  '23': ['cimento-vidro-ceramica', 'Cimento, vidro e cerâmica', T], '24': ['metalurgia', 'Metalurgia', T],
  '25': ['produtos-de-metal', 'Produtos de metal', T], '26': ['eletronicos-informatica', 'Eletrônicos e informática', T],
  '27': ['maquinas-eletricas', 'Máquinas e materiais elétricos', T], '28': ['maquinas-equipamentos', 'Máquinas e equipamentos', T],
  '29': ['veiculos', 'Veículos', T], '30': ['outros-transportes', 'Outros equipamentos de transporte', T],
  '31': ['moveis', 'Móveis', T], '32': ['produtos-diversos', 'Produtos diversos', T], '33': ['manutencao-reparacao', 'Manutenção e reparação', T],
};

async function baixar(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${url}`);
  return r.json();
}
const [linhas, periodos, estados] = await Promise.all([baixar(URL_DADOS), baixar(URL_PERIODOS), baixar(URL_ESTADOS)]);
const periodo = periodos.find((p) => p.id === String(ANO));
if (!periodo) throw new Error(`O IBGE ainda não publicou ${ANO} na tabela ${TABELA}`);
const [d, m, a] = periodo.modificacao.split('/');

const siglaPorCodigo = new Map(estados.map((e) => [String(e.id), e.sigla]));
const siglas = estados.map((e) => e.sigla).sort();
const vazio = () => Object.fromEntries(siglas.map((s) => [s, null]));
// Símbolos do IBGE: "-" = zero; "X" = escondido por sigilo (poucas empresas) -> sem dado.
const ler = (v) => (v === '-' ? 0 : Number.isFinite(Number(v)) ? Number(v) : null);

const setores = new Map();
const totais = { tudo: vazio(), extrativa: vazio(), transformacao: vazio() };
const pessoasTotais = { tudo: vazio(), extrativa: vazio(), transformacao: vazio() };
for (const l of linhas.slice(1)) {
  const uf = siglaPorCodigo.get(l.D1C);
  if (!uf) continue;
  const v = ler(l.V);
  const ehValor = l.D2C === '811';
  if (ehValor && l.MN !== 'Mil Reais') throw new Error(`Unidade inesperada: ${l.MN}`);
  const valor = v === null ? null : ehValor ? v * 1000 : v; // mil R$ -> R$
  const nome = l.D4N.trim();
  const alvo = ehValor ? totais : pessoasTotais;
  if (nome === 'Total') { alvo.tudo[uf] = valor; continue; }
  if (nome.startsWith('B ')) { alvo.extrativa[uf] = valor; continue; }
  if (nome.startsWith('C ')) { alvo.transformacao[uf] = valor; continue; }
  const def = SETORES[nome.slice(0, 2)];
  if (!def) throw new Error(`Setor novo na tabela ${TABELA}: "${nome}". Peça ajuda ao Claude.`);
  const [id, curto, grupo] = def;
  if (!setores.has(id)) setores.set(id, { id, nome: curto, nomeIbge: nome.slice(3), grupo, unidadeQuantidade: 'pessoas', valores: vazio(), quantidades: vazio() });
  const s = setores.get(id);
  if (ehValor) s.valores[uf] = valor; else s.quantidades[uf] = valor;
}

const soma = (o) => Object.values(o).reduce((t, v) => t + (v ?? 0), 0);
const lista = [...setores.values()]
  .map((s) => ({ ...s, valorPais: soma(s.valores), quantidadePais: soma(s.quantidades) }))
  .sort((x, y) => y.valorPais - x.valorPais);
if (lista.length !== 29) throw new Error(`Esperava 29 setores, vieram ${lista.length}`);

// Conferência do sigilo: quanto do valor de cada estado ficou escondido nos setores.
const escondido = {};
for (const s of siglas) {
  const publicado = lista.reduce((t, x) => t + (x.valores[s] ?? 0), 0);
  const total = totais.tudo[s];
  escondido[s] = total ? Math.round((1 - publicado / total) * 1000) / 10 : null; // % do total
}

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Indústria por estado e setor (divisões da CNAE): valor da transformação industrial (R$) e pessoal ocupado. Gerado por scripts/industria-estados/baixar.mjs. Não edite à mão. 0 = sem o setor; null = sem dado (sigilo do IBGE). "escondidoPorSigilo" = % do valor do estado que o IBGE não detalha por setor.',
  pais: 'BR',
  nivel: 'estado',
  periodo: String(ANO),
  baixadoEm: new Date().toISOString().slice(0, 10),
  fontes: [{
    nome: 'IBGE',
    publicacao: `Pesquisa Industrial Anual – Empresa ${ANO} (tabela ${TABELA} do Sidra)`,
    url: `https://sidra.ibge.gov.br/tabela/${TABELA}`,
    dataAtualizacao: `${a}-${m}-${d}`,
  }],
  totais,
  pessoasTotais,
  escondidoPorSigilo: escondido,
  produtos: lista,
}));
console.log(`Pronto: ${lista.length} setores em ${siglas.length} estados (${ANO}) salvos em dados/industria/brasil-estados.json`);
console.log('Maiores:', lista.slice(0, 5).map((s) => `${s.nome} R$ ${(s.valorPais / 1e9).toFixed(1)} bi`).join('; '));
const muito = Object.entries(escondido).filter(([, v]) => v !== null && v >= 25);
if (muito.length) console.log(`Atenção: em ${muito.length} estados, 25% ou mais do valor está escondido por sigilo: ${muito.map(([s, v]) => `${s} ${v}%`).join(', ')}`);
