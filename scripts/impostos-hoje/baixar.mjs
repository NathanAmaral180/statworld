// Monta a faixa "Impostos hoje" (aba Impostos): 3 números nacionais recentes.
//  1. Impostos sobre produtos no PIB (IBGE) — lido de dados/economia/brasil-estados.json
//     (rode antes scripts/pib-estados/baixar.mjs).
//  2. Carga tributária bruta (Tesouro Nacional) — número anual digitado abaixo, conferido no boletim oficial.
//  3. Arrecadação federal do último mês (Receita Federal) — baixada do arquivo de dados abertos da Receita.
// Gera: dados/impostos/brasil-hoje.json
// Como rodar (na pasta statworld):  node scripts/impostos-hoje/baixar.mjs

import { readFile, writeFile, mkdir } from 'node:fs/promises';

// ---- O que muda a cada ano / mês (confira no LEIA-ME) ----------------------
// Carga tributária bruta do governo geral: o Tesouro publica 1 vez por ano (boletim de estimativa).
const CARGA = {
  ano: 2025,
  valor: 32.4, // % do PIB
  dataDivulgacao: '2026-04-10',
  url: 'https://www.gov.br/tesouronacional/pt-br/noticias/carga-tributaria-bruta-do-governo-geral-atinge-32-40-do-pib-em-2025',
  preliminar: true,
};
// Data em que a Receita divulgou o mês mais recente do arquivo (o arquivo não traz essa data).
// Se o arquivo trouxer outro mês, a data fica em branco e o script avisa: atualize aqui.
const ARRECADACAO_DIVULGADA = {
  mes: '2026-09',
  dataDivulgacao: '2026-10-22',
  url: 'https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/outubro/arrecadacao-federal-soma-r-239-384-bilhoes-em-setembro-alta-real-de-5-62',
};
// ----------------------------------------------------------------------------

const URL_ARRECADACAO = 'https://www.gov.br/receitafederal/dados/arrecadacao-estado.csv';
const ECONOMIA = new URL('../../dados/economia/brasil-estados.json', import.meta.url);
const SAIDA = new URL('../../dados/impostos/brasil-hoje.json', import.meta.url);
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// 1. Impostos sobre produtos (do arquivo da Visão geral).
const economia = JSON.parse(await readFile(ECONOMIA, 'utf8'));
const imp = economia.indicadores['impostos-produtos'];
if (!imp || imp.valorPais == null) throw new Error('Rode antes scripts/pib-estados/baixar.mjs (falta "impostos-produtos").');

// 3. Arrecadação federal: soma de todas as colunas de todos os estados no mês mais recente.
const r = await fetch(URL_ARRECADACAO, { headers: { 'User-Agent': 'Mozilla/5.0' } });
if (!r.ok) throw new Error(`A Receita respondeu com erro ${r.status} em ${URL_ARRECADACAO}`);
const texto = new TextDecoder('latin1').decode(await r.arrayBuffer());
const linhas = texto.trim().split(/\r?\n/).map((l) => l.split(';'));
const cab = linhas[0];
if (cab[0] !== 'Ano' || cab[2] !== 'UF') throw new Error('O arquivo da Receita mudou de formato (cabeçalho inesperado).');
const numero = (v) => (v ? Number(v.replace(/\./g, '').replace(',', '.')) : 0);
const chave = (l) => `${l[0]}-${String(MESES.indexOf(l[1].toLowerCase()) + 1).padStart(2, '0')}`;
const dados = linhas.slice(1).filter((l) => l.length > 3 && MESES.includes(l[1].toLowerCase()));
const ultimo = dados.map(chave).sort().at(-1);
const doMes = dados.filter((l) => chave(l) === ultimo);
if (doMes.length !== 27) throw new Error(`Esperava 27 estados em ${ultimo}, achei ${doMes.length}`);
const total = doMes.reduce((t, l) => t + l.slice(3).reduce((s, v) => s + numero(v), 0), 0);
const [anoU, mesU] = ultimo.split('-').map(Number);
const divulgacaoConhecida = ARRECADACAO_DIVULGADA.mes === ultimo;
if (!divulgacaoConhecida) {
  console.log(`Atenção: o arquivo da Receita já tem ${ultimo}. Atualize ARRECADACAO_DIVULGADA no script com a data de divulgação desse mês.`);
}

const saida = {
  _explicacao: 'Faixa "Impostos hoje". Gerado por scripts/impostos-hoje/baixar.mjs. Não edite à mão.',
  pais: 'BR',
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: [
    {
      id: 'impostos-produtos',
      rotulo: `Impostos sobre produtos no PIB, ${imp.periodo}`,
      frequencia: 'anual',
      valor: imp.valorPais,
      formato: 'percentual',
      casas: 1,
      periodo: imp.periodo,
      fontes: imp.fontes,
    },
    {
      id: 'carga-tributaria',
      rotulo: `Carga tributária bruta em ${CARGA.ano}: tudo o que os governos arrecadam, sobre o PIB`,
      frequencia: 'anual',
      valor: CARGA.valor,
      formato: 'percentual',
      casas: 1,
      periodo: String(CARGA.ano),
      observacao: CARGA.preliminar ? 'estimativa preliminar' : undefined,
      fontes: [{
        nome: 'Tesouro Nacional',
        publicacao: `Boletim de Estimativa da Carga Tributária Bruta do Governo Geral ${CARGA.ano}`,
        url: CARGA.url,
        dataDivulgacao: CARGA.dataDivulgacao,
      }],
    },
    {
      id: 'arrecadacao-federal',
      rotulo: `Arrecadação federal em ${MESES[mesU - 1]} de ${anoU}`,
      frequencia: 'mensal',
      valor: Math.round(total),
      formato: 'moeda',
      casas: 1,
      compacto: true,
      periodo: ultimo,
      fontes: [{
        nome: 'Receita Federal',
        publicacao: 'Arrecadação das receitas federais por estado (dados abertos)',
        url: divulgacaoConhecida ? ARRECADACAO_DIVULGADA.url : URL_ARRECADACAO,
        arquivo: URL_ARRECADACAO,
        dataDivulgacao: divulgacaoConhecida ? ARRECADACAO_DIVULGADA.dataDivulgacao : null,
      }],
    },
  ],
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 2));
console.log(`Pronto: dados/impostos/brasil-hoje.json (arrecadação de ${ultimo}: R$ ${(total / 1e9).toFixed(3)} bi)`);
