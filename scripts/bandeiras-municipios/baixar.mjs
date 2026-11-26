// Bandeiras de um estado e dos seus municípios, para a página de estado (título e ficha da cidade).
// 1. Wikidata: qual arquivo é a bandeira (propriedade P41) do estado (pelo código ISO, P300) e de cada município (pelo código do IBGE, P1585).
// 2. Wikimedia Commons: autor e licença de cada arquivo. Só entram licenças livres (domínio público ou Creative Commons);
//    o resto fica sem bandeira (a página simplesmente não mostra).
// 3. Baixa uma miniatura PNG de cada uma para public/bandeiras/br/<uf>/ (o site não depende do Commons no ar).
// Gera: dados/geo/brasil-<uf>-bandeiras.json (arquivo, crédito, licença e página de cada bandeira)
// Como rodar (na pasta statworld):  node scripts/bandeiras-municipios/baixar.mjs
// Outro estado (PowerShell):        $env:UF="MG"; node scripts/bandeiras-municipios/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const UF = (process.env.UF ?? 'SP').toUpperCase();
const UA = { 'user-agent': 'StatWorld-dados/1.0 (projeto pessoal; contato pelo site)' };
const LARGURA = 96; // miniatura: a ficha mostra a bandeira com 28 px de altura
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url, tentativas = 8) {
  for (let i = 1; i <= tentativas; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    console.log(`  resposta ${r.status}, tentando de novo...`);
    const depois = Number(r.headers.get('retry-after')) || 0;
    await espera(Math.max(depois * 1000, 10000 * i));
  }
  throw new Error(`Sem resposta de ${url}`);
}

// 1. Wikidata
const sparql = `SELECT ?codigo ?bandeira WHERE {
  { ?x wdt:P300 "BR-${UF}" . BIND("estado" AS ?codigo) ?x wdt:P41 ?bandeira }
  UNION
  { ?x wdt:P1585 ?codigo . ?x wdt:P41 ?bandeira }
}`;
const estado = (await json('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).find((e) => e.sigla === UF);
if (!estado) throw new Error(`Estado desconhecido: ${UF}`);
const wd = await json(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql.replace('?x wdt:P1585 ?codigo .', `?x wdt:P1585 ?codigo . FILTER(STRSTARTS(?codigo, "${estado.id}"))`))}`);
const arquivoPor = new Map();
for (const b of wd.results.bindings) {
  if (arquivoPor.has(b.codigo.value)) continue; // se houver mais de uma bandeira, fica a primeira
  arquivoPor.set(b.codigo.value, decodeURIComponent(b.bandeira.value.split('/Special:FilePath/')[1]));
}
console.log(`Wikidata: ${arquivoPor.size} bandeiras (estado + municípios).`);

// 2. Commons: licença, autor e miniatura (20 arquivos por consulta, com pausa: o Commons limita pedidos seguidos)
const LIVRE = /^(public domain|pd|cc0|cc[ -]by)/i;
const limpar = (h) => String(h ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const info = new Map();
const nomes = [...new Set(arquivoPor.values())];
for (let i = 0; i < nomes.length; i += 20) {
  const lote = nomes.slice(i, i + 20).map((n) => 'File:' + n);
  const q = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=${LARGURA}&titles=${encodeURIComponent(lote.join('|'))}`;
  const r = await json(q);
  const normal = new Map((r.query.normalized ?? []).map((n) => [n.to, n.from]));
  for (const p of Object.values(r.query.pages)) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const m = ii.extmetadata ?? {};
    const titulo = (normal.get(p.title) ?? p.title).replace(/^File:/, '');
    info.set(titulo.replace(/_/g, ' '), {
      licenca: limpar(m.LicenseShortName?.value),
      autor: limpar(m.Artist?.value) || null,
      miniatura: ii.thumburl,
      pagina: ii.descriptionurl,
    });
  }
  await espera(1500);
}

// 3. Baixa as miniaturas das bandeiras com licença livre
const pasta = new URL(`../../public/bandeiras/br/${UF.toLowerCase()}/`, import.meta.url);
await mkdir(pasta, { recursive: true });
const bandeiras = {};
const recusadas = [];
for (const [codigo, arquivo] of arquivoPor) {
  const i = info.get(arquivo.replace(/_/g, ' '));
  if (!i || !LIVRE.test(i.licenca)) { recusadas.push(`${codigo} (${i?.licenca || 'sem licença'})`); continue; }
  const r = await fetch(i.miniatura, { headers: UA });
  if (!r.ok) { recusadas.push(`${codigo} (erro ${r.status} ao baixar)`); await espera(1000); continue; }
  const nome = `${codigo}.png`;
  await writeFile(new URL(nome, pasta), Buffer.from(await r.arrayBuffer()));
  bandeiras[codigo] = {
    arquivo: `/bandeiras/br/${UF.toLowerCase()}/${nome}`,
    credito: [i.autor, i.licenca].filter(Boolean).join(', '),
    licenca: i.licenca,
    pagina: i.pagina,
  };
  await espera(250);
}

const saida = {
  _explicacao: `Bandeiras de ${estado.nome} e dos seus municípios (chave = código do IBGE; "estado" = a do estado). Só licenças livres. Gerado por scripts/bandeiras-municipios/baixar.mjs. Não edite à mão. Município sem bandeira aqui = sem bandeira na página.`,
  fonte: { nome: 'Wikidata (P41) e Wikimedia Commons', url: 'https://commons.wikimedia.org', baixadoEm: new Date().toISOString().slice(0, 10) },
  estado: UF,
  bandeiras,
  recusadas,
};
await writeFile(new URL(`../../dados/geo/brasil-${UF.toLowerCase()}-bandeiras.json`, import.meta.url), JSON.stringify(saida, null, 1));
console.log(`Pronto: ${Object.keys(bandeiras).length} bandeiras salvas (${bandeiras.estado ? 'com' : 'sem'} a do estado); ${recusadas.length} recusadas por licença ou erro.`);
