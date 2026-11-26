// Atividade econômica de um estado, mês a mês: o que há de mais recente sobre a economia do estado.
//  1. PIB mensal do órgão de estatística do próprio estado (SP: Fundação Seade), com os setores.
//  2. Índice de Atividade Econômica Regional do Banco Central (IBCR), que existe para vários estados
//     e serve de comparação entre eles.
// Gera: dados/economia/brasil-<uf>-atividade.json
// Como rodar (na pasta statworld):  node scripts/atividade-estado/baixar.mjs
// Outro estado (PowerShell):        $env:UF="MG"; node scripts/atividade-estado/baixar.mjs  (precisa estar em ESTADOS)
// Precisa do pacote xlsx (instalado com "npm install").

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx');

// ---- Fontes de cada estado (só entra estado com fonte conferida) ----
const ESTADOS = {
  SP: {
    nome: 'São Paulo',
    pibMensal: {
      orgao: 'Fundação Seade',
      publicacao: 'PIB mensal do Estado de São Paulo',
      // Portal de dados abertos da Seade (CKAN): o script pega sempre a planilha mais recente do conjunto "pib-mensal".
      api: 'https://repositorio.seade.gov.br/api/3/action/package_show?id=pib-mensal',
      pagina: 'https://repositorio.seade.gov.br/dataset/pib-mensal',
    },
    ibcr: { semAjuste: 25392, comAjuste: 25394, nome: 'IBCR-SP' },
  },
};
// ----------------------------------------------------------------------

const UF = (process.env.UF ?? 'SP').toUpperCase();
const cfg = ESTADOS[UF];
if (!cfg) throw new Error(`Estado sem fonte cadastrada em ESTADOS: ${UF}`);
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nomeMes = (m) => `${MESES[Number(m.slice(5)) - 1]} de ${m.slice(0, 4)}`;
const r2 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 100) / 100);

async function baixarJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Erro ${r.status} em ${url}`);
  return r.json();
}

// ---------- 1. PIB mensal (Seade) ----------
const pacote = (await baixarJson(cfg.pibMensal.api)).result;
const recurso = pacote.resources.find((r) => /xlsx/i.test(r.format) && /tabela/i.test(r.name));
if (!recurso) throw new Error('Não achei a planilha do PIB mensal no portal da Seade.');
const resp = await fetch(recurso.url);
if (!resp.ok) throw new Error(`Erro ${resp.status} ao baixar ${recurso.url}`);
const wb = XLSX.read(Buffer.from(await resp.arrayBuffer()));
const linhasDe = (aba) => XLSX.utils.sheet_to_json(wb.Sheets[aba], { header: 1, defval: null });

// Cada aba "Mensal NN" tem: mês (por extenso), ano, agropecuária, indústria, serviços, valor adicionado total, PIB.
// Confere o cabeçalho antes de ler, para não pegar coluna errada se a Seade mudar a planilha.
function lerAba(aba, tituloEsperado) {
  const ls = linhasDe(aba);
  const titulo = String(ls[1]?.[0] ?? '');
  if (!titulo.includes(tituloEsperado)) throw new Error(`A aba ${aba} da Seade mudou (título: "${titulo.slice(0, 80)}...").`);
  const cab = ls.findIndex((l) => l[0] === 'Meses');
  if (ls[cab][6] !== 'PIB' || ls[cab + 1][2] !== 'Agropecuária' || ls[cab + 1][3] !== 'Indústria' || ls[cab + 1][4] !== 'Serviços') {
    throw new Error(`As colunas da aba ${aba} da Seade mudaram.`);
  }
  const porMes = {};
  for (const l of ls.slice(cab + 2)) {
    const i = MESES.indexOf(String(l[0] ?? '').toLowerCase().trim());
    if (i < 0 || typeof l[1] !== 'number') continue;
    const mes = `${l[1]}-${String(i + 1).padStart(2, '0')}`;
    porMes[mes] = { pib: r2(l[6]), agro: r2(l[2]), industria: r2(l[3]), servicos: r2(l[4]) };
  }
  return porMes;
}
const indice = lerAba('Mensal 02', 'com ajuste sazonal');
const mesAnterior = lerAba('Mensal 03', 'mês imediatamente anterior');
const anoAnterior = lerAba('Mensal 04', 'mesmo mês do ano anterior');
const noAno = lerAba('Mensal 05', 'acumuladas no ano');
const em12 = lerAba('Mensal 06', 'últimos 12 meses');

const mesesSeade = Object.keys(indice).sort();
const ultimoSeade = mesesSeade.at(-1);
const fonteSeade = {
  nome: cfg.pibMensal.orgao,
  publicacao: cfg.pibMensal.publicacao,
  url: cfg.pibMensal.pagina,
  arquivo: recurso.url,
  dataAtualizacao: (recurso.last_modified ?? recurso.created ?? '').slice(0, 10) || null,
};
const pibMensal = {
  nome: 'PIB mensal',
  frequencia: 'mensal',
  fontes: [fonteSeade],
  observacao: 'Dados preliminares e sujeitos a revisão (Seade). Crescimento já descontada a inflação (volume).',
  ultimoMes: ultimoSeade,
  periodo: nomeMes(ultimoSeade),
  ultimo: {
    mesAnterior: mesAnterior[ultimoSeade] ?? null,
    anoAnterior: anoAnterior[ultimoSeade] ?? null,
    noAno: noAno[ultimoSeade] ?? null,
    em12Meses: em12[ultimoSeade] ?? null,
  },
  textos: {
    mesAnterior: 'Em relação ao mês anterior, com ajuste sazonal (%)',
    anoAnterior: 'Em relação ao mesmo mês do ano anterior (%)',
    noAno: 'Acumulado no ano, em relação ao mesmo período do ano anterior (%)',
    em12Meses: 'Acumulado em 12 meses (%)',
  },
  // Índice com ajuste sazonal (média de 2010 = 100), para o gráfico no tempo.
  serie: mesesSeade.map((m) => ({ mes: m, nome: nomeMes(m), indice: indice[m].pib, em12Meses: em12[m]?.pib ?? null })),
};

// ---------- 2. IBCR (Banco Central, SGS) ----------
async function sgs(codigo) {
  const dados = await baixarJson(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=01/01/2003`);
  return Object.fromEntries(dados.map((d) => {
    const [, mm, aaaa] = d.data.split('/');
    return [`${aaaa}-${mm}`, r2(Number(d.valor))];
  }));
}
const [semAjuste, comAjuste] = await Promise.all([sgs(cfg.ibcr.semAjuste), sgs(cfg.ibcr.comAjuste)]);
const mesesIbcr = Object.keys(comAjuste).sort();
const ultimoIbcr = mesesIbcr.at(-1);
// Crescimento em 12 meses: soma dos 12 últimos meses do índice sem ajuste ÷ soma dos 12 anteriores (mesma conta do Banco Central para o IBC-Br).
function em12Ibcr(m) {
  const lista = Object.keys(semAjuste).sort();
  const i = lista.indexOf(m);
  if (i < 23) return null;
  const soma = (a, b) => lista.slice(a, b).reduce((s, k) => s + semAjuste[k], 0);
  return r2((soma(i - 11, i + 1) / soma(i - 23, i - 11) - 1) * 100);
}
const ibcr = {
  nome: `Índice de Atividade Econômica Regional (${cfg.ibcr.nome})`,
  frequencia: 'mensal',
  fontes: [{
    nome: 'Banco Central',
    publicacao: `${cfg.ibcr.nome}, séries ${cfg.ibcr.semAjuste} e ${cfg.ibcr.comAjuste} do SGS`,
    url: `https://dadosabertos.bcb.gov.br/dataset/${cfg.ibcr.semAjuste}-sgs`,
    dataConsulta: new Date().toISOString().slice(0, 10),
  }],
  calculo: 'Índice publicado pelo Banco Central. O crescimento em 12 meses é cálculo do StatWorld: soma dos últimos 12 meses do índice sem ajuste ÷ soma dos 12 meses anteriores.',
  ultimoMes: ultimoIbcr,
  periodo: nomeMes(ultimoIbcr),
  ultimo: { indice: comAjuste[ultimoIbcr], em12Meses: em12Ibcr(ultimoIbcr) },
  serie: mesesIbcr.map((m) => ({ mes: m, nome: nomeMes(m), indice: comAjuste[m], em12Meses: em12Ibcr(m) })),
};

const arquivo = `brasil-${UF.toLowerCase()}-atividade`;
const saida = {
  _explicacao: `Atividade econômica de ${cfg.nome}, mês a mês. Gerado por scripts/atividade-estado/baixar.mjs. Não edite à mão. null = sem dado.`,
  estado: UF,
  baixadoEm: new Date().toISOString().slice(0, 10),
  pibMensal,
  ibcr,
};
const dir = new URL('../../dados/economia/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL(`${arquivo}.json`, dir), JSON.stringify(saida, null, 1));
const u = pibMensal.ultimo;
console.log(`Pronto: PIB mensal de ${cfg.nome} até ${pibMensal.periodo} (no ano: ${u.noAno?.pib}%; 12 meses: ${u.em12Meses?.pib}%), ${cfg.ibcr.nome} até ${ibcr.periodo}. Salvo em dados/economia/${arquivo}.json`);
