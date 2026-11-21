// Baixa do IBGE a produção das lavouras (Produção Agrícola Municipal - PAM)
// por estado e por produto: valor da produção (R$) e quantidade (toneladas).
// Gera: dados/agro/brasil-estados-lavouras.json
// Como rodar (na pasta statworld):  node scripts/lavouras-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

// ---- O que muda a cada ano (confira no LEIA-ME) ----------------------------
const ANO = 2025;
// ----------------------------------------------------------------------------

const TABELA = 5457;
const URL_DADOS = `https://apisidra.ibge.gov.br/values/t/${TABELA}/n3/all/v/214,215/p/${ANO}/c782/all`;
const URL_PERIODOS = `https://servicodados.ibge.gov.br/api/v3/agregados/${TABELA}/periodos`;
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const SAIDA = new URL('../../dados/agro/brasil-estados-lavouras.json', import.meta.url);

// Subdivisões que já estão somadas em outro item (não podem contar duas vezes).
const SUBDIVISOES = ['Café (em grão) Arábica', 'Café (em grão) Canephora'];

async function baixar(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${url}`);
  return r.json();
}

const [linhas, periodos, estados] = await Promise.all([baixar(URL_DADOS), baixar(URL_PERIODOS), baixar(URL_ESTADOS)]);
const periodo = periodos.find((p) => p.id === String(ANO));
if (!periodo) throw new Error(`O IBGE ainda não publicou o ano ${ANO} na tabela ${TABELA}`);
const [d, m, a] = periodo.modificacao.split('/');
const dataAtualizacao = `${a}-${m}-${d}`;

const siglaPorCodigo = new Map(estados.map((e) => [String(e.id), e.sigla]));
const siglas = estados.map((e) => e.sigla).sort();

// Símbolos do IBGE: "-" = zero (não produz); "...", "X", ".." = sem dado.
function lerValor(v) {
  if (v === '-') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Nome curto para o site: "Soja (em grão)" -> "Soja"; "Café (em grão) Total" -> "Café".
const nomeCurto = (s) => s.replace(/\*$/, '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\bTotal\b/, '').trim();
const slug = (s) => nomeCurto(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const produtos = new Map(); // código -> produto
const totais = {};
for (const l of linhas.slice(1)) {
  const uf = siglaPorCodigo.get(l.D1C);
  if (!uf) continue;
  const valor = lerValor(l.V);
  if (l.D4C === '0') { // Total geral das lavouras
    if (l.D2C === '215') totais[uf] = valor === null ? null : valor * 1000; // mil R$ -> R$
    continue;
  }
  if (SUBDIVISOES.includes(l.D4N)) continue;
  if (!produtos.has(l.D4C)) {
    produtos.set(l.D4C, { id: slug(l.D4N), codigoIbge: l.D4C, nome: nomeCurto(l.D4N), nomeIbge: l.D4N, unidadeQuantidade: 't', valores: {}, quantidades: {} });
  }
  const p = produtos.get(l.D4C);
  if (l.D2C === '215') p.valores[uf] = valor === null ? null : valor * 1000;
  if (l.D2C === '214') {
    if (l.MN !== 'Toneladas') throw new Error(`${l.D4N}: unidade inesperada (${l.MN})`);
    p.quantidades[uf] = valor;
  }
}

const soma = (obj) => {
  const v = Object.values(obj);
  return v.every((x) => x === null) ? null : v.reduce((s, x) => s + (x ?? 0), 0);
};
const lista = [...produtos.values()]
  .map((p) => {
    for (const s of siglas) { p.valores[s] ??= null; p.quantidades[s] ??= null; }
    return { ...p, valorBrasil: soma(p.valores), quantidadeBrasil: soma(p.quantidades) };
  })
  .filter((p) => p.valorBrasil) // só produtos com produção no país
  .sort((x, y) => y.valorBrasil - x.valorBrasil);

if (new Set(lista.map((p) => p.id)).size !== lista.length) throw new Error('Dois produtos ficaram com o mesmo identificador');
if (Object.keys(totais).length !== 27) throw new Error(`Esperava 27 estados no total, vieram ${Object.keys(totais).length}`);

const saida = {
  _explicacao:
    'Lavouras por estado e produto. Gerado por scripts/lavouras-estados/baixar.mjs. Não edite à mão. Valores em R$; quantidades em toneladas. 0 = não produz; null = sem dado.',
  pais: 'BR',
  nivel: 'estado',
  periodo: String(ANO),
  baixadoEm: new Date().toISOString().slice(0, 10),
  fontes: [
    {
      nome: 'IBGE',
      publicacao: `Produção Agrícola Municipal ${ANO} (tabela ${TABELA} do Sidra)`,
      url: `https://sidra.ibge.gov.br/tabela/${TABELA}`,
      dataAtualizacao,
    },
  ],
  abrangencia: 'Lavouras temporárias e permanentes. Não inclui pecuária, silvicultura nem extração vegetal.',
  totalLavouras: totais,
  produtos: lista,
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida));
console.log(`Pronto: ${lista.length} produtos em 27 estados (${ANO}) salvos em dados/agro/brasil-estados-lavouras.json`);
