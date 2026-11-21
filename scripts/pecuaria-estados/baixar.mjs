// Baixa a pecuária por estado e produto, de duas fontes:
// - IBGE, Pesquisa da Pecuária Municipal (PPM): leite, ovos, mel, lã, casulos (valor e quantidade);
// - MAPA, Valor Bruto da Produção (VBP): bovinos, suínos e frango (só valor; o IBGE não tem esse valor).
// Gera: dados/agro/brasil-estados-pecuaria.json
// Como rodar (na pasta statworld):  node scripts/pecuaria-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx'); // leitor de planilhas Excel

// ---- O que muda a cada atualização (confira no LEIA-ME) --------------------
const ANO = 2025;
const ARQUIVO_VBP = '202610VBPREGIONAL.xlsx'; // planilha "Regional por UF" mais recente do MAPA
const VERSAO_VBP = 'outubro de 2026'; // mês da planilha acima
// ----------------------------------------------------------------------------

const URL_PAGINA_VBP = 'https://www.gov.br/agricultura/pt-br/assuntos/politica-agricola/valor-bruto-da-producao-agropecuaria-vbp';
const URL_VBP = `${URL_PAGINA_VBP}/${ARQUIVO_VBP}`;
const TABELA_PPM = 74;
const URL_PPM = `https://apisidra.ibge.gov.br/values/t/${TABELA_PPM}/n3/all/v/106,215/p/${ANO}/c80/allxt`;
const URL_PERIODOS = `https://servicodados.ibge.gov.br/api/v3/agregados/${TABELA_PPM}/periodos`;
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const SAIDA = new URL('../../dados/agro/brasil-estados-pecuaria.json', import.meta.url);

async function baixar(url, tipo = 'json') {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O site respondeu com erro ${r.status} em ${url}`);
  return tipo === 'json' ? r.json() : Buffer.from(await r.arrayBuffer());
}

const [ppm, periodos, estados, vbp] = await Promise.all([
  baixar(URL_PPM), baixar(URL_PERIODOS), baixar(URL_ESTADOS), baixar(URL_VBP, 'binario'),
]);
const siglas = estados.map((e) => e.sigla).sort();
const siglaPorCodigo = new Map(estados.map((e) => [String(e.id), e.sigla]));
const vazio = () => Object.fromEntries(siglas.map((s) => [s, null]));
const soma = (o) => (Object.values(o).every((v) => v === null) ? null : Object.values(o).reduce((s, v) => s + (v ?? 0), 0));

// ---------- IBGE (PPM) ----------
const periodo = periodos.find((p) => p.id === String(ANO));
if (!periodo) throw new Error(`O IBGE ainda não publicou ${ANO} na tabela ${TABELA_PPM}`);
const [d, m, a] = periodo.modificacao.split('/');
const fontePPM = {
  nome: 'IBGE',
  publicacao: `Pesquisa da Pecuária Municipal ${ANO} (tabela ${TABELA_PPM} do Sidra)`,
  url: `https://sidra.ibge.gov.br/tabela/${TABELA_PPM}`,
  dataAtualizacao: `${a}-${m}-${d}`,
};
// Nome no IBGE -> como aparece no site, e como converter a quantidade.
const PRODUTOS_PPM = {
  'Leite': { id: 'leite', nome: 'Leite', unidadeIbge: 'Mil litros', fator: 1000, unidade: 'L' },
  'Ovos de galinha': { id: 'ovos', nome: 'Ovos', unidadeIbge: 'Mil dúzias', fator: 1000, unidade: 'dúzias' },
  'Ovos de codorna': { id: 'ovos-de-codorna', nome: 'Ovos de codorna', unidadeIbge: 'Mil dúzias', fator: 1000, unidade: 'dúzias' },
  'Mel de abelha': { id: 'mel', nome: 'Mel', unidadeIbge: 'Quilogramas', fator: 1 / 1000, unidade: 't' },
  'Lã': { id: 'la', nome: 'Lã', unidadeIbge: 'Quilogramas', fator: 1 / 1000, unidade: 't' },
  'Casulos do bicho-da-seda': { id: 'casulos-do-bicho-da-seda', nome: 'Casulos do bicho-da-seda', unidadeIbge: 'Quilogramas', fator: 1 / 1000, unidade: 't' },
};
// Símbolos do IBGE: "-" = zero (não produz); "...", "X" = sem dado.
const lerIbge = (v) => (v === '-' ? 0 : Number.isFinite(Number(v)) ? Number(v) : null);

const produtos = new Map();
for (const l of ppm.slice(1)) {
  const def = PRODUTOS_PPM[l.D4N];
  if (!def) throw new Error(`Produto novo na tabela ${TABELA_PPM}: "${l.D4N}". Peça ajuda ao Claude.`);
  const uf = siglaPorCodigo.get(l.D1C);
  if (!produtos.has(def.id)) {
    produtos.set(def.id, { id: def.id, nome: def.nome, unidadeQuantidade: def.unidade, fontes: [fontePPM], valores: vazio(), quantidades: vazio() });
  }
  const p = produtos.get(def.id);
  const v = lerIbge(l.V);
  if (l.D2C === '215') p.valores[uf] = v === null ? null : v * 1000; // mil R$ -> R$
  if (l.D2C === '106') {
    if (l.MN !== def.unidadeIbge) throw new Error(`${l.D4N}: unidade mudou para "${l.MN}"`);
    p.quantidades[uf] = v === null ? null : v * def.fator;
  }
}

// ---------- MAPA (VBP) ----------
const fonteVBP = {
  nome: 'MAPA',
  publicacao: `Valor Bruto da Produção Agropecuária, versão de ${VERSAO_VBP} (valores nominais)`,
  url: URL_PAGINA_VBP,
};
const PRODUTOS_VBP = {
  'Bovino': { id: 'bovinos', nome: 'Bovinos' },
  'Suínos': { id: 'suinos', nome: 'Suínos' },
  'Frangos': { id: 'frango', nome: 'Frango' },
};
const wb = XLSX.read(vbp, { type: 'buffer' });
for (const [aba, def] of Object.entries(PRODUTOS_VBP)) {
  const ws = wb.Sheets[aba];
  if (!ws) throw new Error(`A planilha do MAPA não tem a aba "${aba}"`);
  const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  // Usa o bloco "VALOR BRUTO NOMINAL" (sem correção pela inflação), como os números do IBGE.
  const inicio = linhas.findIndex((l) => typeof l[0] === 'string' && l[0].includes('NOMINAL'));
  if (inicio < 0) throw new Error(`Aba "${aba}": não achei o bloco de valores nominais`);
  const cab = linhas.slice(inicio).find((l) => l.includes(ANO));
  if (!cab) throw new Error(`Aba "${aba}": não tem o ano ${ANO}`);
  const col = cab.indexOf(ANO);
  const p = { id: def.id, nome: def.nome, unidadeQuantidade: null, fontes: [fonteVBP], valores: vazio(), quantidades: vazio() };
  let achados = 0;
  for (const l of linhas.slice(inicio)) {
    if (typeof l[0] !== 'string' || !siglas.includes(l[0].trim())) continue;
    if (++achados > 27) break;
    const v = l[col];
    // No VBP, "-" quer dizer que o MAPA não estimou aquele estado: fica "sem dado", não zero.
    p.valores[l[0].trim()] = typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  if (achados < 27) throw new Error(`Aba "${aba}": esperava 27 estados, achei ${achados}`);
  produtos.set(def.id, p);
}

const lista = [...produtos.values()]
  .map((p) => ({ ...p, valorBrasil: soma(p.valores), quantidadeBrasil: p.unidadeQuantidade ? soma(p.quantidades) : null }))
  .sort((x, y) => (y.valorBrasil ?? 0) - (x.valorBrasil ?? 0));

const saida = {
  _explicacao:
    'Pecuária por estado e produto. Gerado por scripts/pecuaria-estados/baixar.mjs. Não edite à mão. Valores em R$ nominais; 0 = não produz; null = sem dado. Cada produto diz a sua fonte.',
  pais: 'BR',
  nivel: 'estado',
  grupo: 'pecuaria',
  periodo: String(ANO),
  baixadoEm: new Date().toISOString().slice(0, 10),
  fontes: [fontePPM, fonteVBP],
  produtos: lista,
};
await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida));
console.log(`Pronto: ${lista.length} produtos da pecuária (${ANO}) salvos em dados/agro/brasil-estados-pecuaria.json`);
for (const p of lista) console.log(`  ${p.nome}: R$ ${(p.valorBrasil / 1e9).toFixed(1)} bi (${p.fontes[0].nome})`);
