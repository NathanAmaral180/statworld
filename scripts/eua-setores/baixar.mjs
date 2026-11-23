// Estados Unidos: Indústria, Serviços e Impostos por estado, do BEA (Bureau of Economic Analysis),
// arquivo SAGDP (PIB por estado), sem precisar de chave:
//  - SAGDP2: PIB (valor adicionado) por setor, em US$ correntes -> Indústria (19 setores de transformação + 3 extrativos)
//    e Serviços (agrupados nas mesmas 7 atividades do Brasil, para comparar);
//  - SAGDP3: impostos sobre a produção e a importação, menos subsídios -> Impostos (% do PIB).
// Gera: dados/industria/eua-estados.json, dados/servicos/eua-estados.json, dados/impostos/eua-estados.json
// Como rodar (na pasta statworld):  node scripts/eua-setores/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx'); // usado só para abrir o .zip

const URL_ZIP = 'https://apps.bea.gov/regional/zip/SAGDP.zip';
const SIGLAS = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY',
};
const siglas = Object.values(SIGLAS).sort();

// Indústria: linha da tabela SAGDP2 -> setor (id próprio dos EUA; o ícone vem do apelido no arquivo do país).
const INDUSTRIA = [
  { linha: 7, id: 'petroleo-gas', nome: 'Petróleo e gás', grupo: 'extrativa' },
  { linha: 8, id: 'mineracao', nome: 'Mineração (exceto petróleo e gás)', grupo: 'extrativa' },
  { linha: 9, id: 'apoio-extracao', nome: 'Apoio à extração', grupo: 'extrativa' },
  { linha: 14, id: 'madeira', nome: 'Madeira', grupo: 'transformacao' },
  { linha: 15, id: 'minerais-nao-metalicos', nome: 'Minerais não metálicos (cimento, vidro, cerâmica)', grupo: 'transformacao' },
  { linha: 16, id: 'metalurgia', nome: 'Metalurgia', grupo: 'transformacao' },
  { linha: 17, id: 'produtos-de-metal', nome: 'Produtos de metal', grupo: 'transformacao' },
  { linha: 18, id: 'maquinas-equipamentos', nome: 'Máquinas e equipamentos', grupo: 'transformacao' },
  { linha: 19, id: 'eletronicos-informatica', nome: 'Eletrônicos e informática', grupo: 'transformacao' },
  { linha: 20, id: 'maquinas-eletricas', nome: 'Máquinas e materiais elétricos', grupo: 'transformacao' },
  { linha: 21, id: 'veiculos', nome: 'Veículos', grupo: 'transformacao' },
  { linha: 22, id: 'outros-transportes', nome: 'Outros equipamentos de transporte (aviões, navios)', grupo: 'transformacao' },
  { linha: 23, id: 'moveis', nome: 'Móveis', grupo: 'transformacao' },
  { linha: 24, id: 'produtos-diversos', nome: 'Produtos diversos', grupo: 'transformacao' },
  { linha: 26, id: 'alimentos-bebidas-fumo', nome: 'Alimentos, bebidas e fumo', grupo: 'transformacao' },
  { linha: 27, id: 'texteis', nome: 'Têxteis', grupo: 'transformacao' },
  { linha: 28, id: 'vestuario-couro', nome: 'Vestuário e couro', grupo: 'transformacao' },
  { linha: 29, id: 'celulose-papel', nome: 'Papel', grupo: 'transformacao' },
  { linha: 30, id: 'impressao', nome: 'Impressão', grupo: 'transformacao' },
  { linha: 31, id: 'derivados-petroleo', nome: 'Derivados de petróleo e carvão', grupo: 'transformacao' },
  { linha: 32, id: 'quimicos', nome: 'Químicos (inclui farmacêuticos)', grupo: 'transformacao' },
  { linha: 33, id: 'borracha-plastico', nome: 'Borracha e plástico', grupo: 'transformacao' },
];
const TOTAIS_INDUSTRIA = { extrativa: [6], transformacao: [12] }; // linhas oficiais de total de cada grupo

// Serviços: as 7 atividades do Brasil, montadas com as linhas do BEA.
const SERVICOS = [
  { linhas: [34, 35], id: 'comercio', nome: 'Comércio', grupo: 'mercado', descricao: 'Comércio atacadista e varejista.' },
  { linhas: [36], id: 'transporte', nome: 'Transporte e armazenagem', grupo: 'mercado', descricao: 'Transporte aéreo, ferroviário, aquaviário, rodoviário, dutos e armazéns.' },
  { linhas: [45], id: 'informacao-comunicacao', nome: 'Informação e comunicação', grupo: 'mercado', descricao: 'Editoras e software, cinema e som, rádio, TV, telecomunicações e serviços de dados e hospedagem.' },
  { linhas: [51], id: 'financeiras', nome: 'Atividades financeiras e seguros', grupo: 'mercado', descricao: 'Bancos, banco central, investimentos, seguros e fundos.' },
  { linhas: [56], id: 'imobiliarias', nome: 'Atividades imobiliárias e aluguel', grupo: 'mercado', descricao: 'Compra, venda e aluguel de imóveis (inclui o aluguel imputado, uma convenção das contas nacionais) e aluguel de bens.' },
  { linhas: [83], id: 'administracao-publica', nome: 'Governo', grupo: 'publico', descricao: 'Governo federal (civil e militar), estadual e local, incluindo escolas e hospitais públicos e empresas do governo.' },
  { linhas: [59, 68, 75, 82], id: 'outros-servicos', nome: 'Outros serviços', grupo: 'mercado', descricao: 'Serviços profissionais e empresariais; educação e saúde privadas; artes, lazer, hospedagem e alimentação; outros serviços pessoais e associativos.' },
];

const r = await fetch(URL_ZIP);
if (!r.ok) throw new Error(`O BEA respondeu com erro ${r.status} em ${URL_ZIP}`);
const atualizado = r.headers.get('last-modified'); // data em que o BEA atualizou o arquivo
const zip = XLSX.CFB.read(Buffer.from(await r.arrayBuffer()), { type: 'buffer' });

// Lê uma linha de CSV respeitando aspas.
function campos(linha) {
  const out = []; let atual = ''; let aspas = false;
  for (const c of linha) {
    if (c === '"') aspas = !aspas;
    else if (c === ',' && !aspas) { out.push(atual); atual = ''; }
    else atual += c;
  }
  out.push(atual);
  return out.map((x) => x.trim());
}
// Tabela -> { fips: { linha: valor do último ano } }. "(D)" (sigilo) e "(NA)" viram null ("sem dado").
function tabela(prefixo) {
  const arq = zip.FileIndex.find((f) => f.name.startsWith(prefixo) && /ALL_AREAS/.test(f.name));
  if (!arq) throw new Error(`Não achei ${prefixo} no arquivo do BEA.`);
  const linhas = Buffer.from(arq.content).toString('latin1').split(/\r?\n/);
  const cab = campos(linhas[0]);
  const iAno = cab.length - 1;
  const ano = Number(cab[iAno]);
  const unidade = {};
  const dados = {};
  for (const l of linhas.slice(1)) {
    const c = campos(l);
    if (c.length < cab.length) continue;
    const fips = c[0].replace(/"/g, '').slice(0, 2);
    const linha = Number(c[4]);
    const v = Number(c[iAno]);
    (dados[fips] = dados[fips] ?? {})[linha] = Number.isFinite(v) ? v : null;
    unidade[linha] = c[7];
  }
  return { ano, dados, unidade };
}
const t2 = tabela('SAGDP2__'); // milhões de US$
const t3 = tabela('SAGDP3__'); // milhares de US$
if (!/Millions/i.test(t2.unidade[1]) || !/Thousands/i.test(t3.unidade[1])) throw new Error('O BEA mudou as unidades das tabelas.');
const ano = t2.ano;
const vEstado = (t, fips, linha, mult) => { const v = t.dados[fips]?.[linha]; return v == null ? null : v * mult; };
const porSigla = (fn) => Object.fromEntries(Object.entries(SIGLAS).map(([f, s]) => [s, fn(f)]).sort(([a], [b]) => a.localeCompare(b)));
const soma = (vals) => (vals.some((v) => v == null) ? null : vals.reduce((a, b) => a + b, 0));
const fonte = (pub) => ({ nome: 'BEA (EUA)', publicacao: pub, url: 'https://apps.bea.gov/regional/downloadzip.htm', arquivo: URL_ZIP, dataAtualizacao: atualizado ? new Date(atualizado).toISOString().slice(0, 10) : null });
const MI = 1e6;

// ---------- Indústria ----------
const produtosInd = INDUSTRIA.map((s) => {
  const valores = porSigla((f) => vEstado(t2, f, s.linha, MI));
  return { id: s.id, nome: s.nome, grupo: s.grupo, unidadeQuantidade: null, valores, quantidades: porSigla(() => null), valorPais: vEstado(t2, '00', s.linha, MI), quantidadePais: null };
}).sort((a, b) => (b.valorPais ?? 0) - (a.valorPais ?? 0));
const totInd = Object.fromEntries(Object.entries(TOTAIS_INDUSTRIA).map(([g, ls]) => [g, porSigla((f) => soma(ls.map((l) => vEstado(t2, f, l, MI))))]));
totInd.tudo = porSigla((f) => soma([totInd.extrativa[SIGLAS[f]], totInd.transformacao[SIGLAS[f]]]));
// Parte do total escondida por sigilo ("(D)") = total oficial − soma dos setores publicados.
const escondido = porSigla((f) => {
  const s = SIGLAS[f];
  const tot = totInd.tudo[s];
  if (!tot) return null;
  const publicados = produtosInd.reduce((t, p) => t + (p.valores[s] ?? 0), 0);
  return Math.max(0, Math.round(((tot - publicados) / tot) * 1000) / 10);
});
const industria = {
  _explicacao: 'Indústria dos EUA por estado: PIB (valor adicionado) de cada setor, em US$. Gerado por scripts/eua-setores/baixar.mjs. Não edite à mão. null = sem dado (o BEA esconde por sigilo: "(D)").',
  pais: 'US', nivel: 'estado', periodo: String(ano), baixadoEm: new Date().toISOString().slice(0, 10),
  fontes: [fonte(`GDP by State, tabela SAGDP2 (valor adicionado por setor), ${ano}`)],
  totais: totInd, escondidoPorSigilo: escondido, produtos: produtosInd,
};

// ---------- Serviços ----------
const produtosServ = SERVICOS.map((s) => ({
  id: s.id, nome: s.nome, grupo: s.grupo, descricao: s.descricao, unidadeQuantidade: null,
  valores: porSigla((f) => soma(s.linhas.map((l) => vEstado(t2, f, l, MI)))),
  quantidades: porSigla(() => null),
  valorPais: soma(s.linhas.map((l) => vEstado(t2, '00', l, MI))), quantidadePais: null,
})).sort((a, b) => b.valorPais - a.valorPais);
const totServ = Object.fromEntries(['tudo', 'mercado', 'publico'].map((g) => [g, porSigla((f) => {
  const vals = produtosServ.filter((p) => g === 'tudo' || p.grupo === g).map((p) => p.valores[SIGLAS[f]]);
  return vals.every((v) => v == null) ? null : vals.reduce((a, b) => a + (b ?? 0), 0);
})]));
const servicos = {
  _explicacao: 'Serviços dos EUA por estado: PIB (valor adicionado) de cada atividade, agrupado nas mesmas 7 atividades do Brasil. Gerado por scripts/eua-setores/baixar.mjs. Não edite à mão.',
  pais: 'US', nivel: 'estado', periodo: String(ano), baixadoEm: new Date().toISOString().slice(0, 10),
  fontes: [fonte(`GDP by State, tabela SAGDP2 (valor adicionado por setor), ${ano}`)],
  totais: totServ, produtos: produtosServ,
};

// ---------- Impostos ----------
const pct = (f) => {
  const pib = vEstado(t2, f, 1, MI), imp = vEstado(t3, f, 1, 1e3);
  return pib && imp != null ? Math.round((imp / pib) * 1e6) / 1e4 : null;
};
const impostos = {
  _explicacao: 'Impostos sobre a produção e a importação, menos subsídios, em % do PIB de cada estado dos EUA. Gerado por scripts/eua-setores/baixar.mjs. Não edite à mão.',
  pais: 'US', nivel: 'estado', periodo: String(ano), baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: {
    'impostos-producao': {
      nome: 'Impostos sobre a produção e a importação, menos subsídios, % do PIB',
      unidade: '%', periodo: String(ano), frequencia: 'anual',
      fontes: [fonte(`GDP by State, tabelas SAGDP3 (impostos sobre a produção e a importação, menos subsídios) e SAGDP2 (PIB), ${ano}`)],
      calculo: 'Cálculo do StatWorld com números do BEA: impostos sobre a produção e a importação, menos subsídios (SAGDP3) ÷ PIB do estado (SAGDP2) × 100. Inclui impostos sobre vendas, sobre imóveis de empresas e outros que as empresas pagam ao produzir; não inclui imposto de renda. Não é a arrecadação.',
      valorPais: pct('00'),
      valores: porSigla(pct),
    },
  },
};

for (const [pasta, dados] of [['industria', industria], ['servicos', servicos], ['impostos', impostos]]) {
  const saida = new URL(`../../dados/${pasta}/eua-estados.json`, import.meta.url);
  await mkdir(new URL('.', saida), { recursive: true });
  await writeFile(saida, JSON.stringify(dados, null, 2));
}
const bi = (v) => `US$ ${(v / 1e9).toFixed(0)} bi`;
console.log(`BEA ${ano} (atualizado em ${industria.fontes[0].dataAtualizacao}).`);
console.log(`Indústria: ${produtosInd.length} setores; maior: ${produtosInd[0].nome} (${bi(produtosInd[0].valorPais)}). Sem dado (sigilo): ${produtosInd.reduce((t, p) => t + Object.values(p.valores).filter((v) => v == null).length, 0)} valores.`);
console.log(`Serviços: maior: ${produtosServ[0].nome} (${bi(produtosServ[0].valorPais)}).`);
console.log(`Impostos: EUA ${impostos.indicadores['impostos-producao'].valorPais}% do PIB.`);
