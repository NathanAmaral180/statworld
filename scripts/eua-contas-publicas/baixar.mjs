// Estados Unidos: Contas públicas do governo federal. Fontes sem chave:
//  - Tesouro dos EUA, Monthly Treasury Statement, tabela 9 (api.fiscaldata.treasury.gov): receitas por fonte e
//    gastos por função no último ano fiscal completo (outubro a setembro) -> "Cada US$ 100" e "Gasto por função";
//  - Tesouro dos EUA, "Debt to the Penny" (dívida em mãos do público, diária) e BEA (PIB anual, arquivo SAGDP)
//    -> dívida do governo federal em mãos do público, % do PIB, no fim de cada ano.
// Gera: dados/contas-publicas/eua-r100.json, eua-divida.json, eua-funcoes.json
// Como rodar (na pasta statworld):  node scripts/eua-contas-publicas/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx');

const API = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
const hoje = new Date().toLocaleDateString('sv-SE');
async function json(url) {
  for (let t = 1; t <= 4; t++) { const r = await fetch(url); if (r.ok) return r.json(); await new Promise((x) => setTimeout(x, 2000 * t)); }
  throw new Error(`Sem resposta de ${url}`);
}

// ---------- 1. Último ano fiscal completo (MTS, tabela 9) ----------
const ult = await json(`${API}/v1/accounting/mts/mts_table_9?sort=-record_date&page%5Bsize%5D=1`);
const ultimaData = ult.data[0].record_date; // ex.: 2026-10-31
const anoFiscal = Number(ultimaData.slice(5, 7)) >= 10 ? Number(ultimaData.slice(0, 4)) : Number(ultimaData.slice(0, 4)) - 1;
const dataFim = `${anoFiscal}-09-30`;
const t9 = (await json(`${API}/v1/accounting/mts/mts_table_9?filter=record_date:eq:${dataFim}&page%5Bsize%5D=200`)).data;
if (!t9.length) throw new Error(`O Tesouro ainda não tem o fechamento do ano fiscal ${anoFiscal}.`);
const porNome = {};
for (const d of t9) porNome[d.classification_desc.replace(/:$/, '').trim()] = d.current_fytd_rcpt_outly_amt === 'null' ? null : Number(d.current_fytd_rcpt_outly_amt);
const v = (n) => { if (!(n in porNome)) throw new Error(`Não achei "${n}" na tabela 9 do MTS.`); return porNome[n] ?? 0; };
// Os dois 'Total' da tabela: o de receitas vem antes (linha menor), o de gastos depois.
const totais = t9.filter((d) => d.classification_desc === 'Total').sort((x, y) => Number(x.src_line_nbr) - Number(y.src_line_nbr)).map((d) => Number(d.current_fytd_rcpt_outly_amt));
const [receitaTotal, gastoTotal] = totais;

// Funções do orçamento federal (nomes em português; a lista é a da tabela 9 do MTS).
const FUNCOES = {
  'Social Security': 'Previdência Social (aposentadorias e pensões)', 'Medicare': 'Medicare (saúde dos idosos)', 'Net Interest': 'Juros da dívida',
  'Health': 'Saúde (inclui Medicaid)', 'National Defense': 'Defesa', 'Income Security': 'Assistência e seguro-desemprego',
  'Veterans Benefits and Services': 'Veteranos de guerra', 'Transportation': 'Transportes', 'Administration of Justice': 'Justiça e segurança',
  'Education, Training, Employment, and Social Services': 'Educação, treinamento e serviços sociais', 'Community and Regional Development': 'Desenvolvimento regional',
  'Natural Resources and Environment': 'Recursos naturais e meio ambiente', 'Agriculture': 'Agricultura', 'International Affairs': 'Relações internacionais',
  'General Science, Space, and Technology': 'Ciência, espaço e tecnologia', 'General Government': 'Administração geral', 'Energy': 'Energia',
  'Commerce and Housing Credit': 'Comércio e crédito habitacional', 'Undistributed Offsetting Receipts': 'Receitas compensatórias (descontos)',
};
const funcoesTodas = Object.entries(FUNCOES).map(([en, pt]) => ({ codigo: en, nome: pt, valor: v(en) }));
const somaFuncoes = funcoesTodas.reduce((t, f) => t + f.valor, 0);
if (Math.abs(somaFuncoes - gastoTotal) > 1e9) throw new Error(`A soma das funções (${somaFuncoes}) não bate com o gasto total (${gastoTotal}).`);

const ENTRADAS = [
  { id: 'consumo', rotulo: 'Impostos sobre consumo e importação', inclui: 'Impostos seletivos (combustível, bebida, cigarro…) e tarifas de importação', nomes: ['Excise Taxes', 'Customs Duties'], cor: 'p-leite' },
  { id: 'renda', rotulo: 'Impostos sobre renda e lucro', inclui: 'Imposto de renda das pessoas e das empresas', nomes: ['Individual Income Taxes', 'Corporation Income Taxes'], cor: 'p-soja' },
  { id: 'previdencia', rotulo: 'Contribuições à Previdência', inclui: 'Contribuições para aposentadoria, Medicare e seguro-desemprego', nomes: ['Employment and General Retirement', 'Unemployment Insurance', 'Other Retirement'], cor: 'p-milho' },
  { id: 'outras', rotulo: 'Outras receitas', inclui: 'Impostos sobre herança e doações e receitas diversas (como os lucros do Fed)', nomes: ['Estate and Gift Taxes', 'Miscellaneous Receipts'], cor: 'p-gado' },
];
const SAIDAS = [
  { id: 'previdencia', rotulo: 'Previdência Social', inclui: 'Aposentadorias e pensões (Social Security)', nomes: ['Social Security'], cor: 'p-leite' },
  { id: 'juros', rotulo: 'Juros da dívida', inclui: 'Juros líquidos pagos pela dívida federal', nomes: ['Net Interest'], cor: 'p-soja' },
  { id: 'saude', rotulo: 'Saúde (Medicare e Medicaid)', inclui: 'Medicare (idosos) e saúde, incluindo Medicaid', nomes: ['Medicare', 'Health'], cor: 'p-milho' },
  { id: 'defesa', rotulo: 'Defesa', inclui: 'Forças armadas e defesa nacional', nomes: ['National Defense'], cor: 'p-gado' },
  { id: 'assistencia', rotulo: 'Assistência social', inclui: 'Seguro-desemprego, auxílio-alimentação, créditos de imposto para famílias e outros', nomes: ['Income Security'], cor: 'p-mandioca' },
  { id: 'veteranos', rotulo: 'Veteranos de guerra', inclui: 'Benefícios e saúde dos veteranos', nomes: ['Veterans Benefits and Services'], cor: 'p-cana' },
  { id: 'demais', rotulo: 'Demais funções', inclui: 'Transportes, educação, justiça, ciência, agricultura e as demais funções, menos as receitas compensatórias', nomes: Object.keys(FUNCOES).filter((n) => !['Social Security', 'Net Interest', 'Medicare', 'Health', 'National Defense', 'Income Security', 'Veterans Benefits and Services'].includes(n)), cor: 'p-cafe' },
];
const grupo = (g) => ({ id: g.id, rotulo: g.rotulo, inclui: g.inclui, cor: g.cor, valor: g.nomes.reduce((t, n) => t + v(n), 0) });
const entradas = ENTRADAS.map(grupo);
const saidas = SAIDAS.map(grupo);
const somaEntradas = entradas.reduce((t, g) => t + g.valor, 0);
if (Math.abs(somaEntradas - receitaTotal) > 1e9) throw new Error(`A soma das receitas (${somaEntradas}) não bate com o total (${receitaTotal}).`);
entradas.push({ id: 'nova-divida', rotulo: 'Nova dívida', inclui: 'O que faltou para pagar tudo: o governo pega emprestado (déficit)', cor: 'p-mandioca', valor: gastoTotal - receitaTotal });
function cem(valores, total) {
  const brutos = valores.map((x) => (x / total) * 100);
  const inteiros = brutos.map(Math.floor);
  const falta = 100 - inteiros.reduce((a, b) => a + b, 0);
  brutos.map((b, i) => [b - Math.floor(b), i]).sort((a, b) => b[0] - a[0]).slice(0, falta).forEach(([, i]) => inteiros[i]++);
  return inteiros;
}
const qE = cem(entradas.map((g) => g.valor), gastoTotal), qS = cem(saidas.map((g) => g.valor), gastoTotal);
const fonteMts = { nome: 'Tesouro dos EUA', publicacao: `Monthly Treasury Statement, tabela 9, ano fiscal de ${anoFiscal} (out/${anoFiscal - 1} a set/${anoFiscal})`, url: 'https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/', dataConsulta: hoje };
const r100 = {
  _explicacao: 'EUA: de onde vem e para onde vai cada US$ 100 do governo federal no último ano fiscal completo. Gerado por scripts/eua-contas-publicas/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje, periodo: `ano fiscal ${anoFiscal}`, frequencia: 'anual', fontes: [fonteMts],
  calculo: 'Cálculo do StatWorld com a tabela 9 do Monthly Treasury Statement: gastos = gasto líquido total (inclui juros); receitas = receita total; "nova dívida" = gastos − receitas (o déficit). Cada lado é reduzido a US$ 100 e arredondado para somar 100. O ano fiscal dos EUA vai de outubro a setembro.',
  totais: { gastos: gastoTotal, receitas: receitaTotal, novaDivida: gastoTotal - receitaTotal },
  entradas: entradas.map((g, i) => ({ ...g, de100: qE[i] })),
  saidas: saidas.map((g, i) => ({ ...g, de100: qS[i] })),
};
const positivas = funcoesTodas.filter((f) => f.valor > 0).sort((a, b) => b.valor - a.valor);
const negativas = funcoesTodas.filter((f) => f.valor <= 0);
const funcoes = {
  _explicacao: 'EUA: gasto do governo federal por função do orçamento no último ano fiscal completo. Gerado por scripts/eua-contas-publicas/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje, periodo: `ano fiscal ${anoFiscal}`, frequencia: 'anual', fontes: [fonteMts],
  total: gastoTotal,
  observacao: negativas.length ? `Não aparecem na lista, porque são valores negativos (descontos no gasto): ${negativas.map((f) => `${f.nome} (−US$ ${Math.abs(f.valor / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} bi)`).join('; ')}.` : undefined,
  funcoes: positivas.map((f) => ({ ...f, parte: Math.round((f.valor / gastoTotal) * 10000) / 100 })),
};

// ---------- 2. Dívida em mãos do público, % do PIB (fim de cada ano) ----------
const divida = (await json(`${API}/v2/accounting/od/debt_to_penny?fields=record_date,debt_held_public_amt&filter=record_date:gte:2008-01-01&sort=record_date&page%5Bsize%5D=10000`)).data;
const fimDeAno = {};
for (const d of divida) fimDeAno[d.record_date.slice(0, 4)] = Number(d.debt_held_public_amt); // fica o último dia de cada ano
const hojeDivida = divida.at(-1);
const rz = await fetch('https://apps.bea.gov/regional/zip/SAGDP.zip');
if (!rz.ok) throw new Error(`O BEA respondeu com erro ${rz.status}`);
const zip = XLSX.CFB.read(Buffer.from(await rz.arrayBuffer()), { type: 'buffer' });
const sagdp2 = zip.FileIndex.find((f) => /^SAGDP2__ALL_AREAS/.test(f.name));
const linhas = Buffer.from(sagdp2.content).toString('latin1').split(/\r?\n/);
const anos = linhas[0].split(',').slice(8).map((x) => x.trim());
const linhaEua = linhas.find((l) => /^\s*"00000",.*?,SAGDP2,1,/.test(l)).split(',');
const vals = linhaEua.slice(linhaEua.length - anos.length).map(Number);
const pib = Object.fromEntries(anos.map((a, i) => [a, vals[i] * 1e6]));
const pontos = Object.keys(pib).filter((a) => a >= '2008' && fimDeAno[a] && pib[a]).sort()
  .map((a) => ({ periodo: a, nome: a, valor: Math.round((fimDeAno[a] / pib[a]) * 1000) / 10 }));
const dividaSaida = {
  _explicacao: 'EUA: dívida do governo federal em mãos do público, % do PIB, no fim de cada ano. Gerado por scripts/eua-contas-publicas/baixar.mjs. Não edite à mão.',
  pais: 'US', baixadoEm: hoje, periodo: pontos.at(-1).nome,
  hoje: { data: hojeDivida.record_date, valor: Number(hojeDivida.debt_held_public_amt) },
  serie: {
    nome: 'Dívida em mãos do público, % do PIB', unidade: '%', frequencia: 'anual',
    fontes: [
      { nome: 'Tesouro dos EUA', publicacao: 'Debt to the Penny, dívida em mãos do público (último dia de cada ano)', url: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/', dataConsulta: hoje },
      { nome: 'BEA (EUA)', publicacao: 'PIB dos EUA, tabela SAGDP2', url: 'https://apps.bea.gov/regional/downloadzip.htm' },
    ],
    calculo: 'Cálculo do StatWorld: dívida em mãos do público no último dia do ano ÷ PIB do ano. Não inclui a dívida que o governo deve a si mesmo (fundos internos) nem a de estados e cidades.',
    pontos,
  },
};

await mkdir(new URL('../../dados/contas-publicas/', import.meta.url), { recursive: true });
await writeFile(new URL('../../dados/contas-publicas/eua-r100.json', import.meta.url), JSON.stringify(r100, null, 2));
await writeFile(new URL('../../dados/contas-publicas/eua-funcoes.json', import.meta.url), JSON.stringify(funcoes, null, 2));
await writeFile(new URL('../../dados/contas-publicas/eua-divida.json', import.meta.url), JSON.stringify(dividaSaida, null, 2));
const tri = (x) => `US$ ${(x / 1e12).toFixed(3)} tri`;
console.log(`Ano fiscal ${anoFiscal}: receitas ${tri(receitaTotal)}, gastos ${tri(gastoTotal)}, déficit ${tri(gastoTotal - receitaTotal)}.`);
console.log(`Cada US$ 100: ${r100.saidas.map((g) => `${g.rotulo} ${g.de100}`).join(', ')} | nova dívida ${r100.entradas.at(-1).de100}.`);
console.log(`Dívida em mãos do público: ${pontos.at(-1).valor}% do PIB em ${pontos.at(-1).nome}; hoje ${tri(dividaSaida.hoje.valor)} (${hojeDivida.record_date}).`);
