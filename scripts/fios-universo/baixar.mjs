// Baixa a matéria-prima do Universo dos Fios (protótipo):
// 1) a lista de artigos das cronologias da Wikipédia em inglês ("Timeline of historic inventions" e
//    "Timeline of scientific discoveries");
// 2) do Wikidata, para cada artigo: nome em português, descrição, tipo, ano, inventores, datas de pessoas;
// 3) da Wikipédia, quais desses artigos linkam para quais (são os "fios" do emaranhado).
// Tudo fica guardado em scripts/fios-universo/cache/ (fora do GitHub): rodar de novo só baixa o que falta.
// Como rodar (na pasta statworld):  node scripts/fios-universo/baixar.mjs
import fs from 'node:fs';

const CACHE = new URL('./cache/', import.meta.url);
fs.mkdirSync(CACHE, { recursive: true });
const arq = (n) => new URL(n, CACHE);
const ler = (n, padrao) => (fs.existsSync(arq(n)) ? JSON.parse(fs.readFileSync(arq(n), 'utf8')) : padrao);
const gravar = (n, v) => fs.writeFileSync(arq(n), JSON.stringify(v));
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { 'user-agent': 'StatWorld-prototipo/1.0 (projeto pessoal; contato pelo site)' };

// Pede com paciência: a Wikimedia limita o ritmo. Se ela pedir calma, espera 1, 2, 3… minutos.
async function pedir(url) {
  for (let t = 0; t < 8; t++) {
    try {
      const txt = await (await fetch(url, { headers: UA })).text();
      return JSON.parse(txt);
    } catch {
      console.log(`  (a Wikimedia pediu calma; esperando ${t + 1} min)`);
      await pausa(60000 * (t + 1));
    }
  }
  throw new Error('A Wikimedia não respondeu depois de várias tentativas. Tente mais tarde.');
}

// ---------- 1) lista de artigos ----------
const CRONOLOGIAS = ['Timeline of historic inventions', 'Timeline of scientific discoveries'];
let titulos = ler('titulos.json', null);
if (!titulos) {
  const todos = new Set();
  for (const pagina of CRONOLOGIAS) {
    let cont = {};
    do {
      const j = await pedir('https://en.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'query', prop: 'links', titles: pagina, plnamespace: '0', pllimit: 'max', format: 'json', ...cont }));
      for (const p of Object.values(j.query.pages)) for (const l of p.links ?? []) todos.add(l.title);
      cont = j.continue ?? null;
      await pausa(1500);
    } while (cont);
  }
  titulos = [...todos];
  gravar('titulos.json', titulos);
}
console.log(`1) ${titulos.length} artigos nas cronologias`);

// ---------- 2) Wikidata ----------
const ents = ler('ents.json', {});
// títulos já tentados (alguns não têm item no Wikidata): não pede de novo, assim a lista não muda entre execuções
const tentados = new Set(ler('tentados.json', Object.values(ents).map((e) => e.en)));
const faltam = titulos.filter((t) => !tentados.has(t));
for (let i = 0; i < faltam.length; i += 50) {
  const lote = faltam.slice(i, i + 50);
  const j = await pedir('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', sites: 'enwiki', titles: lote.join('|'), props: 'labels|descriptions|claims|sitelinks', languages: 'pt-br|pt|en', sitefilter: 'ptwiki|enwiki', format: 'json' }));
  for (const e of Object.values(j.entities ?? {})) {
    if (!e.id || e.missing !== undefined) continue;
    const c = e.claims ?? {};
    const ids = (p) => (c[p] ?? []).map((x) => x.mainsnak?.datavalue?.value?.id).filter(Boolean);
    const ano = (p) => { const t = c[p]?.[0]?.mainsnak?.datavalue?.value?.time; return t ? parseInt(t.slice(0, t.indexOf('-', 1))) : null; };
    ents[e.id] = {
      id: e.id, en: e.sitelinks?.enwiki?.title, pt: e.sitelinks?.ptwiki?.title,
      nome: e.labels?.['pt-br']?.value ?? e.labels?.pt?.value ?? e.labels?.en?.value,
      desc: e.descriptions?.['pt-br']?.value ?? e.descriptions?.pt?.value ?? e.descriptions?.en?.value,
      tipos: ids('P31'), inventores: ids('P61'),
      ano: ano('P575') ?? ano('P571') ?? ano('P585') ?? ano('P580'),
      nasc: ano('P569'), morte: ano('P570'),
    };
  }
  for (const t of lote) tentados.add(t);
  gravar('ents.json', ents);
  gravar('tentados.json', [...tentados]);
  await pausa(4000);
}
console.log(`2) ${Object.keys(ents).length} itens do Wikidata`);

// ---------- 3) links entre os artigos escolhidos (os fios) ----------
// Só os artigos que entram no universo (mesma escolha de montar.mjs).
const { escolher } = await import('./escolher.mjs');
// em ordem alfabética: os blocos ficam iguais entre execuções (o cache continua valendo)
const escolhidos = escolher(Object.values(ents), { paraBaixar: true }).map((e) => e.en).filter(Boolean).sort();
const links = ler('links.json', {});
const blocos = [];
for (let i = 0; i < escolhidos.length; i += 50) blocos.push(escolhidos.slice(i, i + 50));
let n = 0;
for (const de of blocos) for (const para of blocos) {
  const chave = `${de[0]}|${para[0]}|${de.length}|${para.length}`;
  n++;
  if (links[chave]) continue;
  const achados = [];
  let cont = {};
  do {
    const j = await pedir('https://en.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'query', prop: 'links', titles: de.join('|'), pltitles: para.join('|'), pllimit: 'max', format: 'json', redirects: '1', ...cont }));
    for (const p of Object.values(j.query?.pages ?? {})) for (const l of p.links ?? []) achados.push([p.title, l.title]);
    cont = j.continue ?? null;
    await pausa(1500);
  } while (cont);
  links[chave] = achados;
  gravar('links.json', links);
  if (n % 20 === 0) console.log(`  links: ${n} de ${blocos.length ** 2} blocos`);
}
console.log(`3) ${Object.values(links).flat().length} links entre ${escolhidos.length} artigos`);
console.log('Pronto. Agora rode: node scripts/fios-universo/montar.mjs');
