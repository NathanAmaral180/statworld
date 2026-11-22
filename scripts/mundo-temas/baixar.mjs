// Baixa do Banco Mundial (Indicadores de Desenvolvimento Mundial, WDI) um número de referência
// do mundo para cada tema da página inicial. Gera: dados/mundo/temas.json
// Como rodar (na pasta statworld):  node scripts/mundo-temas/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const SAIDA = new URL('../../dados/mundo/temas.json', import.meta.url);

// Tema -> indicador do Banco Mundial e de onde ele vem originalmente.
const TEMAS = [
  { tema: 'economia', indicador: 'NY.GDP.MKTP.CD', rotulo: 'PIB mundial', unidade: 'moeda-usd', origem: 'Banco Mundial e OCDE' },
  { tema: 'saude', indicador: 'SP.DYN.LE00.IN', rotulo: 'Expectativa de vida ao nascer no mundo', unidade: 'anos', origem: 'ONU, World Population Prospects' },
  { tema: 'politica', indicador: 'SG.GEN.PARL.ZS', rotulo: 'Cadeiras de parlamentos ocupadas por mulheres', unidade: '%', origem: 'União Interparlamentar' },
  { tema: 'demografia', indicador: 'SP.POP.TOTL', rotulo: 'População mundial', unidade: 'pessoas', origem: 'ONU, World Population Prospects' },
];

const resultado = [];
for (const t of TEMAS) {
  const url = `https://api.worldbank.org/v2/country/WLD/indicator/${t.indicador}?format=json&mrnev=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`O Banco Mundial respondeu com erro ${r.status} em ${t.indicador}`);
  const [meta, linhas] = await r.json();
  const linha = linhas?.[0];
  const valor = typeof linha?.value === 'number' ? linha.value : null; // sem valor = sem dado
  resultado.push({
    ...t,
    valor,
    periodo: linha?.date ?? null,
    fontes: [{
      nome: 'Banco Mundial',
      publicacao: `Indicadores de Desenvolvimento Mundial (${t.indicador}); dado original: ${t.origem}`,
      url: `https://data.worldbank.org/indicator/${t.indicador}`,
      dataAtualizacao: meta?.lastupdated,
    }],
  });
}

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Um número do mundo por tema, para a página inicial. Gerado por scripts/mundo-temas/baixar.mjs. Não edite à mão. null = sem dado.',
  baixadoEm: new Date().toISOString().slice(0, 10),
  temas: resultado,
}, null, 2));
for (const t of resultado) console.log(`${t.tema}: ${t.valor} (${t.periodo})`);
