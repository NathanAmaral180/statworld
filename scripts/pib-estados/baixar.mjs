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

// Série completa 2002–ANO, na mesma metodologia (referência 2010). Serve o ano mais recente e os anteriores.
const PRIMEIRO_ANO = 2002;
const URL_ZIP = `https://ftp.ibge.gov.br/Contas_Regionais/${ANO}/xls/Especiais_${PRIMEIRO_ANO}_${ANO}_xls.zip`;
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const SAIDA = new URL('../../dados/economia/brasil-estados.json', import.meta.url);
const SAIDA_ANOS = new URL('../../dados/economia/brasil-estados-anos.json', import.meta.url);

// População de cada ano (para o PIB por pessoa), sempre do IBGE:
// estimativas anuais (tabela 6579); nos anos de Censo e Contagem o IBGE não faz estimativa, então vale a contagem.
// 2023: o IBGE não publicou estimativa (depois do Censo 2022) → PIB por pessoa fica "sem dado" nesse ano.
const POPULACAO = {
  estimativas: { url: 'https://apisidra.ibge.gov.br/values/t/6579/n3/all/v/9324/p/all', publicacao: (a) => `Estimativas da População ${a} (tabela 6579 do Sidra)`, link: 'https://sidra.ibge.gov.br/tabela/6579' },
  2007: { url: 'https://apisidra.ibge.gov.br/values/t/793/n3/all/v/93/p/2007', publicacao: () => 'Contagem da População 2007 (tabela 793 do Sidra)', link: 'https://sidra.ibge.gov.br/tabela/793' },
  2010: { url: 'https://apisidra.ibge.gov.br/values/t/202/n3/all/v/93/p/2010', publicacao: () => 'Censo Demográfico 2010 (tabela 202 do Sidra)', link: 'https://sidra.ibge.gov.br/tabela/202' },
  2022: { url: 'https://apisidra.ibge.gov.br/values/t/4709/n3/all/v/93/p/2022', publicacao: () => 'Censo Demográfico 2022 (tabela 4709 do Sidra)', link: 'https://sidra.ibge.gov.br/tabela/4709' },
};

// IPCA (número-índice mensal, tabela 1737 do Sidra): corrige o PIB por pessoa dos anos antigos para reais de ANO.
const URL_IPCA = 'https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/2266/p/all';

async function baixar(url, tipo = 'json') {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${url}`);
  return tipo === 'json' ? r.json() : Buffer.from(await r.arrayBuffer());
}

const [zip, estados, popEstimativas, pop2007, pop2010, pop2022, ipcaBruto] = await Promise.all([
  baixar(URL_ZIP, 'binario'),
  baixar(URL_ESTADOS),
  baixar(POPULACAO.estimativas.url),
  baixar(POPULACAO[2007].url),
  baixar(POPULACAO[2010].url),
  baixar(POPULACAO[2022].url),
  baixar(URL_IPCA),
]);

// Média do índice do IPCA em cada ano (12 meses) → fator que leva reais de um ano para reais de ANO.
const ipcaMeses = {};
for (const l of ipcaBruto.slice(1)) (ipcaMeses[l.D3C.slice(0, 4)] ??= []).push(Number(l.V));
const ipcaMedia = Object.fromEntries(Object.entries(ipcaMeses).filter(([, m]) => m.length === 12).map(([a, m]) => [a, m.reduce((x, y) => x + y) / 12]));
if (!ipcaMedia[ANO]) throw new Error(`O IPCA de ${ANO} ainda não tem os 12 meses no IBGE`);
const fatorIPCA = (a) => (ipcaMedia[a] ? ipcaMedia[ANO] / ipcaMedia[a] : null);
const fonteIPCA = { nome: 'IBGE', publicacao: 'IPCA, número-índice (tabela 1737 do Sidra)', url: 'https://sidra.ibge.gov.br/tabela/1737' };

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
  // Cada estado: { [ano]: valor } de todos os anos da tabela.
  const anos = cabecalho.filter((x) => typeof x === 'number');
  const porEstado = {};
  for (const l of linhas) {
    if (typeof l[0] !== 'string') continue;
    const chave = sem(l[0]) === 'brasil' ? 'BR' : siglaPorNome.get(sem(l[0]));
    if (!chave) continue; // pula regiões, título e rodapé
    porEstado[chave] = Object.fromEntries(anos.map((a) => [a, num(l[cabecalho.indexOf(a)])]));
  }
  if (Object.keys(porEstado).length !== 28)
    throw new Error(`${nomeArquivo}: esperava Brasil + 27 estados, achei ${Object.keys(porEstado).length}`);
  return porEstado;
}
// Vazio vira null ("sem dado"), nunca zero.
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const pib = lerTabela('tab01.xls'); // milhões de R$
const participacao = lerTabela('tab02.xls'); // %
const volume = lerTabela('tab03.xls'); // índice
const vab = lerTabela('tab04.xls'); // valor adicionado bruto, milhões de R$
const ANOS = Object.keys(pib.SP).map(Number).filter((a) => a >= PRIMEIRO_ANO && a <= ANO).sort();

// População: { [ano]: { [sigla]: pessoas } } e de onde veio cada ano.
const populacao = {};
const fontePopAno = {};
const guardarPop = (linhas, origem) => {
  for (const l of linhas.slice(1)) {
    const a = Number(l.D3C);
    (populacao[a] ??= {})[siglaPorCodigo.get(l.D1C)] = num(Number(l.V));
    fontePopAno[a] = origem;
  }
};
guardarPop(popEstimativas, 'estimativas');
guardarPop(pop2007, 2007);
guardarPop(pop2010, 2010);
guardarPop(pop2022, 2022);


const arred = (v, casas) => (v === null || v === undefined ? null : Math.round(v * 10 ** casas) / 10 ** casas);
const siglas = estados.map((e) => e.sigla).sort();
const valores = (fn) => Object.fromEntries(siglas.map((s) => [s, fn(s)]));
// Parte do PIB que são impostos sobre produtos (líquidos de subsídios), em %.
const impostosPct = (p, v) => (p == null || v == null || !p ? null : ((p - v) / p) * 100);

// Todos os anos vêm da mesma publicação (a mais recente revisa a série inteira).
const fonteContas = {
  nome: 'IBGE',
  publicacao: `Contas Regionais do Brasil ${ANO}`,
  url: URL_NOTICIA,
  arquivo: URL_ZIP,
  dataDivulgacao: DATA_DIVULGACAO,
};
const fontePopulacaoDe = (a) => {
  const origem = fontePopAno[a];
  if (!origem) return null;
  const p = origem === 'estimativas' ? POPULACAO.estimativas : POPULACAO[origem];
  return { nome: 'IBGE', publicacao: p.publicacao(a), url: p.link };
};

// As quatro medidas de um ano. Valores que o IBGE não publica (ou que não dá para calcular) ficam null.
function indicadoresDoAno(a) {
  const pop = populacao[a] ?? {};
  const fontePop = fontePopulacaoDe(a);
  return {
    'peso-pib': {
      nome: 'Participação no PIB do Brasil',
      unidade: '%',
      periodo: String(a),
      fontes: [fonteContas],
      calculo: 'Valor publicado pelo IBGE (Tabela 2 das Contas Regionais).',
      valores: valores((s) => arred(participacao[s][a], 4)),
    },
    'pib-por-pessoa': (() => {
      // Anos anteriores a ANO: corrigido pela inflação (IPCA) para reais de ANO, para o mapa comparar anos de verdade.
      // O valor da época (sem correção) fica em "valoresDaEpoca" e aparece na ficha.
      const corrigir = a !== ANO;
      const fator = fatorIPCA(a);
      const daEpoca = valores((s) => (pib[s][a] == null || !pop[s] ? null : arred((pib[s][a] * 1e6) / pop[s], 0)));
      const base = fontePop
        ? 'Cálculo do StatWorld: PIB do estado (Tabela 1 das Contas Regionais) dividido pela população do IBGE no mesmo ano (estimativa anual; em anos de Censo ou Contagem, a própria contagem).'
        : `Sem dado: o IBGE não publicou a população dos estados para ${a} (depois do Censo 2022 não houve estimativa para esse ano), então não dá para dividir o PIB por pessoa.`;
      return {
        nome: corrigir ? `PIB por pessoa, em R$ de ${ANO}` : 'PIB por pessoa',
        unidade: 'moeda',
        periodo: String(a),
        fontes: [fonteContas, ...(fontePop ? [fontePop] : []), ...(corrigir ? [fonteIPCA] : [])],
        calculo: corrigir && fontePop ? `${base} Para comparar com ${ANO}, o valor foi corrigido pela inflação: multiplicado pela média do IPCA de ${ANO} dividida pela média do IPCA de ${a} (fator ${fator?.toFixed(3).replace('.', ',')}).` : base,
        ...(corrigir ? { anoDosReais: String(ANO), valoresDaEpoca: daEpoca } : {}),
        valores: corrigir ? valores((s) => (daEpoca[s] == null || !fator ? null : arred(daEpoca[s] * fator, 0))) : daEpoca,
      };
    })(),
    'impostos-produtos': {
      nome: 'Impostos sobre produtos, % do PIB',
      unidade: '%',
      periodo: String(a),
      frequencia: 'anual',
      fontes: [fonteContas],
      calculo:
        'Cálculo do StatWorld com números do IBGE: (PIB − valor adicionado bruto) ÷ PIB × 100 (Tabelas 1 e 4 das Contas Regionais). Pela definição do IBGE, PIB = valor adicionado + impostos, líquidos de subsídios, sobre produtos. Não é arrecadação.',
      // Valor do país inteiro (linha "Brasil" das mesmas tabelas), para comparar cada estado com a média.
      valorPais: arred(impostosPct(pib.BR[a], vab.BR[a]), 4),
      valores: valores((s) => arred(impostosPct(pib[s][a], vab[s][a]), 4)),
    },
    crescimento: {
      nome: `Crescimento real do PIB em ${a}`,
      unidade: '%',
      periodo: String(a),
      fontes: [fonteContas],
      calculo: `Variação do índice de volume do PIB (Tabela 3 das Contas Regionais) de ${a - 1} para ${a}, descontada a inflação.`,
      valores: valores((s) =>
        volume[s][a] == null || volume[s][a - 1] == null ? null : arred((volume[s][a] / volume[s][a - 1] - 1) * 100, 4)
      ),
    },
  };
}

const baixadoEm = new Date().toISOString().slice(0, 10);
const saida = {
  _explicacao:
    'Medidas de economia por estado. Gerado por scripts/pib-estados/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR',
  nivel: 'estado',
  periodo: String(ANO),
  baixadoEm,
  indicadores: indicadoresDoAno(ANO),
};
// Todos os anos (para o seletor de ano e o "ver a evolução" do site). O ano mais recente também está aqui.
const saidaAnos = {
  _explicacao: `Mesmas medidas de brasil-estados.json, ano a ano (${ANOS[0]}–${ANO}). Gerado por scripts/pib-estados/baixar.mjs. Não edite à mão. null = sem dado. Valores em R$ são da época (sem correção pela inflação).`,
  pais: 'BR',
  nivel: 'estado',
  anos: ANOS.map(String),
  baixadoEm,
  porAno: Object.fromEntries(ANOS.map((a) => [String(a), indicadoresDoAno(a)])),
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 2));
await writeFile(SAIDA_ANOS, JSON.stringify(saidaAnos));
const semDado = Object.values(saida.indicadores).flatMap((i) => Object.values(i.valores)).filter((v) => v === null).length;
console.log(`Pronto: dados de ${siglas.length} estados (${ANO}) salvos em dados/economia/brasil-estados.json`);
console.log(`E a série ${ANOS[0]}–${ANO} (${ANOS.length} anos) em dados/economia/brasil-estados-anos.json`);
console.log(semDado ? `Atenção: ${semDado} valores ficaram como "sem dado".` : 'Nenhum valor ficou sem dado.');
const anosSemPop = ANOS.filter((a) => !fontePopAno[a]);
if (anosSemPop.length) console.log(`Sem população do IBGE (PIB por pessoa = sem dado): ${anosSemPop.join(', ')}`);
