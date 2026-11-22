// Baixa do IBGE o PIB dos estados (Contas Regionais) e a população estimada,
// e calcula as três medidas do mapa de Economia.
// Gera: dados/economia/brasil-estados.json
// Como rodar (na pasta statworld):  node scripts/pib-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx'); // leitor de planilhas Excel

// ---- O que muda a cada ano (confira no LEIA-ME) ----------------------------
const ANO = 2024; // ano mais recente das Contas Regionais
const DATA_DIVULGACAO = '2026-11-13'; // data em que o IBGE divulgou esse ano
const URL_NOTICIA =
  'https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/48614-pib-cresceu-em-25-das-27-unidades-da-federacao-em-2024.html';
// ----------------------------------------------------------------------------

const URL_ZIP = `https://ftp.ibge.gov.br/Contas_Regionais/${ANO}/xls/Especiais_2010_${ANO}_xls.zip`;
const URL_POPULACAO = `https://apisidra.ibge.gov.br/values/t/6579/n3/all/v/9324/p/${ANO}`;
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const SAIDA = new URL('../../dados/economia/brasil-estados.json', import.meta.url);

async function baixar(url, tipo = 'json') {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${url}`);
  return tipo === 'json' ? r.json() : Buffer.from(await r.arrayBuffer());
}

const [zip, populacaoBruta, estados] = await Promise.all([
  baixar(URL_ZIP, 'binario'),
  baixar(URL_POPULACAO),
  baixar(URL_ESTADOS),
]);

const sem = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const siglaPorNome = new Map(estados.map((e) => [sem(e.nome), e.sigla]));
const siglaPorCodigo = new Map(estados.map((e) => [String(e.id), e.sigla]));

// Abre o .zip e lê uma das tabelas (tab01.xls, tab02.xls...).
const pacote = XLSX.CFB.read(zip, { type: 'buffer' });
function lerTabela(nomeArquivo) {
  const arq = XLSX.CFB.find(pacote, nomeArquivo);
  if (!arq) throw new Error(`Não achei ${nomeArquivo} dentro do zip do IBGE`);
  const wb = XLSX.read(arq.content, { type: 'buffer' });
  const linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
  const cabecalho = linhas.find((l) => l.includes(ANO));
  if (!cabecalho) throw new Error(`${nomeArquivo} não tem o ano ${ANO}`);
  const col = (ano) => cabecalho.indexOf(ano);
  const porEstado = {};
  for (const l of linhas) {
    if (typeof l[0] !== 'string') continue;
    const sigla = siglaPorNome.get(sem(l[0]));
    if (!sigla) continue; // pula Brasil, regiões, título e rodapé
    porEstado[sigla] = { atual: num(l[col(ANO)]), anterior: num(l[col(ANO - 1)]) };
  }
  if (Object.keys(porEstado).length !== 27)
    throw new Error(`${nomeArquivo}: esperava 27 estados, achei ${Object.keys(porEstado).length}`);
  return porEstado;
}
// Linha "Brasil" de uma tabela (total do país), no ano escolhido.
function lerBrasil(nomeArquivo) {
  const wb = XLSX.read(XLSX.CFB.find(pacote, nomeArquivo).content, { type: 'buffer' });
  const linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
  const cabecalho = linhas.find((l) => l.includes(ANO));
  const linha = linhas.find((l) => typeof l[0] === 'string' && sem(l[0]) === 'brasil');
  if (!linha) throw new Error(`${nomeArquivo}: não achei a linha Brasil`);
  return num(linha[cabecalho.indexOf(ANO)]);
}
// Vazio vira null ("sem dado"), nunca zero.
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const pib = lerTabela('tab01.xls'); // milhões de R$
const participacao = lerTabela('tab02.xls'); // %
const volume = lerTabela('tab03.xls'); // índice, 2010 = 100
const vab = lerTabela('tab04.xls'); // valor adicionado bruto, milhões de R$

const populacao = {};
for (const l of populacaoBruta.slice(1)) {
  populacao[siglaPorCodigo.get(l.D1C)] = num(Number(l.V));
}

const pibBrasil = lerBrasil('tab01.xls');
const vabBrasil = lerBrasil('tab04.xls');
// Parte do PIB que são impostos sobre produtos (líquidos de subsídios), em %.
const impostosPct = (p, v) => (p === null || v === null || !p ? null : ((p - v) / p) * 100);

const arred = (v, casas) => (v === null ? null : Math.round(v * 10 ** casas) / 10 ** casas);
const siglas = estados.map((e) => e.sigla).sort();
const valores = (fn) => Object.fromEntries(siglas.map((s) => [s, fn(s)]));

const fonteContas = {
  nome: 'IBGE',
  publicacao: `Contas Regionais do Brasil ${ANO}`,
  url: URL_NOTICIA,
  arquivo: URL_ZIP,
  dataDivulgacao: DATA_DIVULGACAO,
};
const fontePopulacao = {
  nome: 'IBGE',
  publicacao: `Estimativas da População ${ANO} (tabela 6579 do Sidra)`,
  url: `https://sidra.ibge.gov.br/tabela/6579`,
};

const saida = {
  _explicacao:
    'Medidas de economia por estado. Gerado por scripts/pib-estados/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR',
  nivel: 'estado',
  periodo: String(ANO),
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: {
    'peso-pib': {
      nome: 'Participação no PIB do Brasil',
      unidade: '%',
      periodo: String(ANO),
      fontes: [fonteContas],
      calculo: 'Valor publicado pelo IBGE (Tabela 2 das Contas Regionais).',
      valores: valores((s) => arred(participacao[s].atual, 4)),
    },
    'pib-por-pessoa': {
      nome: 'PIB por pessoa',
      unidade: 'moeda',
      periodo: String(ANO),
      fontes: [fonteContas, fontePopulacao],
      calculo:
        'Cálculo do StatWorld: PIB do estado (Tabela 1 das Contas Regionais) dividido pela população estimada pelo IBGE para o mesmo ano.',
      valores: valores((s) =>
        pib[s].atual === null || !populacao[s] ? null : arred((pib[s].atual * 1e6) / populacao[s], 0)
      ),
    },
    'impostos-produtos': {
      nome: 'Impostos sobre produtos, % do PIB',
      unidade: '%',
      periodo: String(ANO),
      frequencia: 'anual',
      fontes: [fonteContas],
      calculo:
        'Cálculo do StatWorld com números do IBGE: (PIB − valor adicionado bruto) ÷ PIB × 100 (Tabelas 1 e 4 das Contas Regionais). Pela definição do IBGE, PIB = valor adicionado + impostos, líquidos de subsídios, sobre produtos. Não é arrecadação.',
      // Valor do país inteiro (linha "Brasil" das mesmas tabelas), para comparar cada estado com a média.
      valorPais: arred(impostosPct(pibBrasil, vabBrasil), 4),
      valores: valores((s) => arred(impostosPct(pib[s].atual, vab[s].atual), 4)),
    },
    crescimento: {
      nome: `Crescimento real do PIB em ${ANO}`,
      unidade: '%',
      periodo: String(ANO),
      fontes: [fonteContas],
      calculo: `Variação do índice de volume do PIB (Tabela 3 das Contas Regionais) de ${ANO - 1} para ${ANO}, descontada a inflação.`,
      valores: valores((s) =>
        volume[s].atual === null || volume[s].anterior === null
          ? null
          : arred((volume[s].atual / volume[s].anterior - 1) * 100, 4)
      ),
    },
  },
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 2));
const semDado = Object.values(saida.indicadores).flatMap((i) => Object.values(i.valores)).filter((v) => v === null).length;
console.log(`Pronto: dados de ${siglas.length} estados (${ANO}) salvos em dados/economia/brasil-estados.json`);
console.log(semDado ? `Atenção: ${semDado} valores ficaram como "sem dado".` : 'Nenhum valor ficou sem dado.');
