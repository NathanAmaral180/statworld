// Baixa do Banco Central (sistema SGS) os indicadores que mudam com frequência,
// para a faixa "Agora" da página inicial. Gera: dados/agora/brasil.json
// Como rodar (na pasta statworld):  node scripts/brasil-agora/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const SAIDA = new URL('../../dados/agora/brasil.json', import.meta.url);
const url = (serie, n) => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/${n}?formato=json`;
const hoje = new Date().toISOString().slice(0, 10);
const paraIso = (d) => { const [dd, mm, aa] = d.split('/'); return `${aa}-${mm}-${dd}`; };

// n = quantos valores (o Banco Central aceita até 20) ou, se for maior, quantos dias para trás.
async function serie(numero, n) {
  let endereco = url(numero, n);
  if (n > 20) {
    const br = (d) => d.toISOString().slice(0, 10).split('-').reverse().join('/');
    const ini = new Date(Date.now() - n * 86400000);
    endereco = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${numero}/dados?formato=json&dataInicial=${br(ini)}&dataFinal=${br(new Date())}`;
  }
  const r = await fetch(endereco);
  if (!r.ok) throw new Error(`O Banco Central respondeu com erro ${r.status} na série ${numero}`);
  const lista = (await r.json())
    .map((x) => ({ data: paraIso(x.data), valor: Number(x.valor) }))
    // A série da Selic traz dias futuros (a meta vale até a próxima reunião): só até hoje.
    .filter((x) => x.data <= hoje && Number.isFinite(x.valor));
  if (lista.length < 2) throw new Error(`A série ${numero} veio com poucos valores`);
  return lista;
}

const fonte = (serieNum, nome) => ({ nome: 'Banco Central do Brasil', publicacao: `${nome} (série ${serieNum} do SGS)`, url: `https://www3.bcb.gov.br/sgspub/consultarvalores/telaCvsSelecionarSeries.paint` });

// Dólar comercial, venda (PTAX) — série 1, diária (dias úteis).
const dolar = await serie(1, 5);
const [dAnt, dUlt] = dolar.slice(-2);

// Selic, meta — série 432. Mostra a última mudança.
const selic = await serie(432, 900);
const sUlt = selic.at(-1);
let iMud = selic.length - 1;
while (iMud > 0 && selic[iMud - 1].valor === sUlt.valor) iMud--;
const sAnterior = iMud > 0 ? selic[iMud - 1].valor : null;

// IPCA acumulado em 12 meses — série 13522, mensal.
const ipca = await serie(13522, 3);
const [iAnt, iUlt] = ipca.slice(-2);

const saida = {
  _explicacao: 'Indicadores da faixa "Agora". Gerado por scripts/brasil-agora/baixar.mjs. Não edite à mão. Cada número traz a data a que se refere.',
  pais: 'BR',
  baixadoEm: hoje,
  indicadores: [
    {
      id: 'dolar', rotulo: 'Dólar comercial, venda (PTAX)', frequencia: 'diário',
      valor: dUlt.valor, formato: 'moeda', casas: 2, data: dUlt.data,
      variacao: { tipo: 'percentual', valor: (dUlt.valor / dAnt.valor - 1) * 100, desde: dAnt.data },
      fontes: [fonte(1, 'Taxa de câmbio, dólar americano, venda, PTAX')],
    },
    {
      id: 'selic', rotulo: 'Selic, meta ao ano', frequencia: 'por reunião',
      valor: sUlt.valor, formato: 'percentual', casas: 2, data: sUlt.data,
      variacao: { tipo: 'pontos', valor: sAnterior === null ? null : sUlt.valor - sAnterior, desde: selic[iMud].data, mantida: true },
      fontes: [fonte(432, 'Meta Selic definida pelo Copom')],
    },
    {
      id: 'ipca12', rotulo: 'Inflação (IPCA) em 12 meses', frequencia: 'mensal',
      valor: iUlt.valor, formato: 'percentual', casas: 2, data: iUlt.data, periodoMensal: true,
      variacao: { tipo: 'pontos', valor: iUlt.valor - iAnt.valor, desde: iAnt.data },
      fontes: [fonte(13522, 'IPCA acumulado em 12 meses, calculado pelo IBGE')],
    },
  ],
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 2));
console.log(`Pronto: dólar ${dUlt.valor} (${dUlt.data}), Selic ${sUlt.valor}% (desde ${selic[iMud].data}), IPCA 12m ${iUlt.valor}% (${iUlt.data})`);
