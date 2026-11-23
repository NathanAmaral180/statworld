// Aba "Dinheiro e juros". Baixa do Banco Central (sistema SGS, dados abertos) as séries do painel:
// dólar (diário), Selic meta (muda nas reuniões do Copom), juros médios do crédito, juros do crédito pessoal,
// inadimplência e saldo do crédito (mensais). Diárias: últimos 5 anos; mensais: últimos 10 anos.
// Gera: dados/dinheiro/brasil-series.json
// Como rodar (na pasta statworld):  node scripts/dinheiro/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

// ---- As séries do painel (número no SGS e como mostrar) --------------------
const SERIES = [
  { id: 'dolar', sgs: 1, nome: 'Dólar comercial', detalhe: 'R$ por US$, venda (PTAX)', unidade: 'moeda', casas: 4, frequencia: 'diário', variacao: 'percentual', anos: 5 },
  { id: 'selic', sgs: 432, nome: 'Selic', detalhe: 'meta, % ao ano', unidade: '%', casas: 2, frequencia: 'por reunião', variacao: 'pontos', anos: 5 },
  { id: 'juros-credito', sgs: 20714, nome: 'Juros médios do crédito', detalhe: '% ao ano, todas as operações', unidade: '%', casas: 2, frequencia: 'mensal', variacao: 'pontos', anos: 10 },
  { id: 'juros-pessoal', sgs: 20742, nome: 'Juros do crédito pessoal', detalhe: '% ao ano, não consignado', unidade: '%', casas: 2, frequencia: 'mensal', variacao: 'pontos', anos: 10 },
  { id: 'inadimplencia', sgs: 21082, nome: 'Inadimplência', detalhe: '% da carteira de crédito com atraso acima de 90 dias', unidade: '%', casas: 2, frequencia: 'mensal', variacao: 'pontos', anos: 10 },
  { id: 'saldo-credito', sgs: 20539, nome: 'Saldo do crédito', detalhe: 'R$, total emprestado no país', unidade: 'moeda', casas: 1, compacto: true, multiplicador: 1e6, frequencia: 'mensal', variacao: 'percentual', anos: 10 },
];
// Nomes oficiais (catálogo de dados abertos do Banco Central), para a fonte de cada série.
const NOMES_OFICIAIS = {
  1: 'Taxa de câmbio - Livre - Dólar americano (venda) - diário (PTAX)',
  432: 'Taxa de juros - Meta Selic definida pelo Copom',
  20714: 'Taxa média de juros das operações de crédito - Total',
  20742: 'Taxa média de juros das operações de crédito com recursos livres - Pessoas físicas - Crédito pessoal não consignado',
  21082: 'Inadimplência da carteira de crédito - Total',
  20539: 'Saldo da carteira de crédito - Total',
};
// ----------------------------------------------------------------------------

const SAIDA = new URL('../../dados/dinheiro/brasil-series.json', import.meta.url);
const hoje = new Date();
const hojeIso = hoje.toLocaleDateString('sv-SE'); // data de hoje no horário do Brasil (AAAA-MM-DD)
const br = (d) => d.toISOString().slice(0, 10).split('-').reverse().join('/');
const paraIso = (d) => { const [dd, mm, aa] = d.split('/'); return `${aa}-${mm}-${dd}`; };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function baixarSerie(s) {
  const ini = new Date(hoje); ini.setFullYear(ini.getFullYear() - s.anos);
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${s.sgs}/dados?formato=json&dataInicial=${br(ini)}&dataFinal=${br(hoje)}`;
  for (let t = 1; t <= 4; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (r.ok) {
      const lista = (await r.json())
        .map((x) => ({ data: paraIso(x.data), valor: Number(x.valor) * (s.multiplicador ?? 1) }))
        .filter((x) => x.data <= hojeIso && Number.isFinite(x.valor)); // a Selic traz dias futuros: só até hoje
      if (lista.length >= 2) return lista;
    }
    await espera(2000 * t); // o Banco Central às vezes responde vazio: espera e tenta de novo
  }
  throw new Error(`O Banco Central não entregou a série ${s.sgs} (${s.nome}).`);
}

const series = [];
for (const s of SERIES) {
  const pontos = await baixarSerie(s);
  series.push({
    ...s,
    fontes: [{
      nome: 'Banco Central do Brasil',
      publicacao: `${NOMES_OFICIAIS[s.sgs]} (série ${s.sgs} do SGS)`,
      url: `https://dadosabertos.bcb.gov.br/dataset/${s.sgs}`,
      dataConsulta: hojeIso,
    }],
    pontos,
  });
  console.log(`${s.nome}: ${pontos.length} valores, último ${pontos.at(-1).valor} em ${pontos.at(-1).data}`);
  await espera(500);
}

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Séries do painel "Dinheiro e juros" (Banco Central, SGS). Gerado por scripts/dinheiro/baixar.mjs. Não edite à mão. Cada ponto traz a data a que se refere (dia ou mês).',
  pais: 'BR',
  baixadoEm: hojeIso,
  series,
}, null, 2));
console.log('Pronto: dados/dinheiro/brasil-series.json');
