// Monta o Universo dos Fios (protótipo) a partir do que baixar.mjs guardou em cache/:
// escolhe os itens, liga pelos links da Wikipédia e pelos inventores (Wikidata), junta as trilhas conferidas
// (dados/fios/*.json), calcula a posição de cada ponto (ForceAtlas2) e as regiões (Louvain).
// Gera: dados/fios/universo.json   ·   Como rodar (na pasta statworld):  node scripts/fios-universo/montar.mjs
import fs from 'node:fs';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import louvain from 'graphology-communities-louvain';
import { escolher } from './escolher.mjs';

// Sorteios sempre iguais (semente fixa): o desenho e as regiões saem iguais a cada vez que o script roda.
let semente = 20261125;
Math.random = () => { semente |= 0; semente = (semente + 0x6d2b79f5) | 0; let x = Math.imul(semente ^ (semente >>> 15), 1 | semente); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };

const cache = (n) => JSON.parse(fs.readFileSync(new URL(`./cache/${n}`, import.meta.url), 'utf8'));
const ents = Object.values(cache('ents.json'));
const links = Object.values(cache('links.json')).flat();
const nomesRegioes = JSON.parse(fs.readFileSync(new URL('./regioes.json', import.meta.url), 'utf8'));

// ---------- Itens e pessoas ----------
const escolhidos = escolher(ents);
const porEn = new Map(escolhidos.map((e) => [e.en, e]));
const porId = new Map(escolhidos.map((e) => [e.id, e]));
const g = new Graph({ type: 'undirected' });
for (const e of escolhidos) g.addNode(e.id, { e });
const ligar = (a, b) => { if (a !== b && g.hasNode(a) && g.hasNode(b) && !g.hasEdge(a, b)) g.addEdge(a, b); };
for (const [de, para] of links) ligar(porEn.get(de)?.id, porEn.get(para)?.id);
for (const e of escolhidos) for (const inv of e.inventores) ligar(e.id, inv);

// ---------- Trilhas conferidas (dados/fios/*.json, menos o próprio universo) ----------
// Cada item conferido se junta ao item do Wikidata com o mesmo artigo da Wikipédia; se não houver, entra como item novo.
const pastaFios = new URL('../../dados/fios/', import.meta.url);
const trilhas = fs.readdirSync(pastaFios).filter((f) => f.endsWith('.json') && f !== 'universo.json').map((f) => JSON.parse(fs.readFileSync(new URL(f, pastaFios), 'utf8')));
const tituloDe = (url) => { const m = url.match(/https:\/\/(en|pt)\.wikipedia\.org\/wiki\/(.+)$/); return m ? { lang: m[1], titulo: decodeURIComponent(m[2]).replace(/_/g, ' ') } : null; };
const conferido = new Map(); // id do nó -> { trilha, item }
for (const t of trilhas) {
  const idDoItem = {};
  for (const n of t.nos) {
    let achado = null;
    for (const f of n.fontes) {
      const w = tituloDe(f.url);
      if (!w) continue;
      // só junta com outro item (nunca com uma pessoa: o cartão do telefone cita o artigo de Bell, mas não é Bell)
      achado = escolhidos.find((e) => !e.tipos.includes('Q5') && (w.lang === 'en' ? e.en === w.titulo : e.pt === w.titulo));
      if (achado) break;
    }
    // sem artigo igual: tenta pelo nome (ex.: "Telefone" conferido = "telefone" do Wikidata), nunca uma pessoa
    if (!achado) achado = escolhidos.find((e) => !e.tipos.includes('Q5') && e.nome?.toLowerCase() === n.nome.toLowerCase());
    const id = achado?.id ?? `fio:${t.id}:${n.id}`;
    // pessoas citadas nas fontes do item conferido (ex.: o artigo de Graham Bell no cartão do Telefone) viram fios até o universo
    const pessoasCitadas = n.fontes.map((f) => tituloDe(f.url)).filter(Boolean).map((w) => escolhidos.find((e) => e.tipos.includes('Q5') && (w.lang === 'en' ? e.en === w.titulo : e.pt === w.titulo))).filter(Boolean);
    if (!g.hasNode(id)) g.addNode(id, { e: { id, nome: n.nome, ano: n.ano, tipos: [], desc: null } });
    conferido.set(id, { trilha: t.id, n });
    for (const p of pessoasCitadas) ligar(id, p.id);
    idDoItem[n.id] = id;
  }
  for (const l of t.ligacoes) ligar(idDoItem[l.de], idDoItem[l.para]);
}

// Fora: quem ficou sem nenhum fio, e pessoas com um fio só (não fazem ponte entre assuntos).
g.forEachNode((id, a) => { if (g.degree(id) === 0) g.dropNode(id); });
g.forEachNode((id, a) => { if (a.e.tipos.includes('Q5') && g.degree(id) < 2 && !conferido.has(id)) g.dropNode(id); });
g.forEachNode((id) => { if (g.degree(id) === 0) g.dropNode(id); });

// ---------- Regiões (comunidades) e posições ----------
const comunidade = louvain(g, { resolution: 1.15, randomWalk: false, rng: Math.random });
// Regiões grandes viram "galáxias" com nome; as pequenas se juntam na mais ligada a elas.
const tamanho = {};
for (const c of Object.values(comunidade)) tamanho[c] = (tamanho[c] ?? 0) + 1;
const grandes = Object.entries(tamanho).filter(([, n]) => n >= 12).sort((a, b) => b[1] - a[1]).map(([c]) => Number(c));
const regiaoDe = {};
g.forEachNode((id) => {
  let c = comunidade[id];
  if (!grandes.includes(c)) {
    const votos = {};
    g.forEachNeighbor(id, (v) => { const cv = comunidade[v]; if (grandes.includes(cv)) votos[cv] = (votos[cv] ?? 0) + 1; });
    c = Number(Object.entries(votos).sort((a, b) => b[1] - a[1])[0]?.[0] ?? grandes[0]);
  }
  regiaoDe[id] = grandes.indexOf(c);
});

// Posições em dois passos: (1) cada galáxia é arrumada sozinha, só com os fios de dentro;
// (2) as galáxias são espalhadas pelo espaço conforme o quanto se ligam (mais fios entre elas = mais perto).
// Os fios entre galáxias viram linhas longas cruzando o espaço: o "emaranhado" visto de longe.
const nReg = grandes.length;
const raio = [];
for (let i = 0; i < nReg; i++) {
  const sub = new Graph({ type: 'undirected' });
  g.forEachNode((id) => { if (regiaoDe[id] === i) sub.addNode(id, { x: Math.random() * 10, y: Math.random() * 10 }); });
  g.forEachEdge((ed, a, s, d) => { if (regiaoDe[s] === i && regiaoDe[d] === i) sub.addEdge(s, d); });
  forceAtlas2.assign(sub, { iterations: 600, settings: { ...forceAtlas2.inferSettings(sub), barnesHutOptimize: sub.order > 200, gravity: 1, scalingRatio: 4 } });
  // centraliza e mede o raio da galáxia
  const xs = sub.mapNodes((id, a) => a.x), ys = sub.mapNodes((id, a) => a.y);
  const cx = xs.reduce((s, v) => s + v, 0) / xs.length, cy = ys.reduce((s, v) => s + v, 0) / ys.length;
  const r = Math.max(...sub.mapNodes((id, a) => Math.hypot(a.x - cx, a.y - cy))) || 1;
  // todas as galáxias na mesma escala visual: raio proporcional à raiz do número de itens
  const alvo = 40 * Math.sqrt(sub.order);
  sub.forEachNode((id, a) => g.mergeNodeAttributes(id, { lx: ((a.x - cx) / r) * alvo, ly: ((a.y - cy) / r) * alvo }));
  raio[i] = alvo;
}
const meta = new Graph({ type: 'undirected' });
for (let i = 0; i < nReg; i++) meta.addNode(String(i), { x: Math.cos((i / nReg) * 6.283) * 500, y: Math.sin((i / nReg) * 6.283) * 500, size: raio[i] });
g.forEachEdge((ed, a, s, d) => {
  const [rs, rd] = [regiaoDe[s], regiaoDe[d]];
  if (rs === rd) return;
  const k = meta.edge(String(rs), String(rd));
  if (k) meta.updateEdgeAttribute(k, 'weight', (w) => w + 1); else meta.addEdge(String(rs), String(rd), { weight: 1 });
});
forceAtlas2.assign(meta, { iterations: 800, getEdgeWeight: 'weight', settings: { gravity: 0.5, scalingRatio: 60, adjustSizes: true, strongGravityMode: false } });
// afasta até nenhuma galáxia encostar na outra (com folga)
let escala = 1;
const centro = (i) => meta.getNodeAttributes(String(i));
for (let passo = 0; passo < 200; passo++) {
  let encosta = false;
  for (let a = 0; a < nReg; a++) for (let b = a + 1; b < nReg; b++) {
    const pa = centro(a), pb = centro(b);
    if (Math.hypot(pa.x - pb.x, pa.y - pb.y) * escala < (raio[a] + raio[b]) * 1.25) encosta = true;
  }
  if (!encosta) break;
  escala *= 1.08;
}
g.forEachNode((id, a) => {
  const c = centro(regiaoDe[id]);
  g.mergeNodeAttributes(id, { x: c.x * escala + a.lx, y: c.y * escala + a.ly });
});

// Nome de cada região: escolhido à mão em regioes.json pelo item mais ligado dela (o script mostra quais são).
const CORES = ['#6ea8ff', '#7ee0c3', '#c59bff', '#ff9e7a', '#ffd36e', '#7fd3ff', '#ff8fb8', '#a8e07e', '#9fb2ff', '#ffb86b', '#6fe3e3', '#e0a8ff', '#b5c7d9', '#ffc4a3'];
const usados = new Set();
const regioes = grandes.map((c, i) => {
  const ids = g.filterNodes((id) => regiaoDe[id] === i);
  const topo = [...ids].sort((a, b) => g.degree(b) - g.degree(a));
  // nome: o primeiro dos 8 itens mais ligados da região que tenha nome em regioes.json (e que ainda não foi usado)
  const chaves = topo.slice(0, 8).map((id) => g.getNodeAttribute(id, 'e').en ?? id);
  const chave = chaves.find((k) => nomesRegioes[k] && !usados.has(nomesRegioes[k])) ?? chaves[0];
  if (nomesRegioes[chave]) usados.add(nomesRegioes[chave]);
  const x = ids.reduce((s, id) => s + g.getNodeAttribute(id, 'x'), 0) / ids.length;
  const y = ids.reduce((s, id) => s + g.getNodeAttribute(id, 'y'), 0) / ids.length;
  return { nome: nomesRegioes[chave] ?? `[${topo.slice(0, 3).map((id) => g.getNodeAttribute(id, 'e').nome).join(' · ')}]`, chave, cor: CORES[i % CORES.length], x, y, n: ids.length };
});

// ---------- Saída ----------
const indice = new Map(g.nodes().map((id, i) => [id, i]));
const wikiDe = (e) => (e.pt ? `https://pt.wikipedia.org/wiki/${encodeURIComponent(e.pt.replace(/ /g, '_'))}` : e.en ? `https://en.wikipedia.org/wiki/${encodeURIComponent(e.en.replace(/ /g, '_'))}` : null);
const nos = g.nodes().map((id) => {
  const a = g.getNodeAttributes(id);
  const e = a.e;
  const c = conferido.get(id);
  const pessoa = e.tipos?.includes('Q5');
  return {
    id, n: c?.n.nome ?? e.nome, t: pessoa ? 'p' : 'i',
    a: c?.n.ano ?? e.ano ?? undefined, nasc: pessoa ? e.nasc ?? undefined : undefined, morte: pessoa ? e.morte ?? undefined : undefined,
    x: Math.round(a.x * 10) / 10, y: Math.round(a.y * 10) / 10, s: Math.round((1.6 + Math.sqrt(g.degree(id)) * 1.15) * 10) / 10,
    r: regiaoDe[id], d: e.desc ?? undefined, w: wikiDe(e) ?? undefined,
    ...(c ? { c: 1, k: c.n.id, trilha: c.trilha, resumo: c.n.resumo } : {}),
  };
});
const arestas = g.edges().map((ed) => g.extremities(ed).map((id) => indice.get(id)));
const saida = {
  _explicacao: 'Universo dos Fios (protótipo). Gerado por scripts/fios-universo/montar.mjs. Itens e pessoas: Wikidata (CC0); fios: links entre artigos da Wikipédia e inventores do Wikidata; itens com c=1 foram conferidos à mão nas trilhas de dados/fios/. Não edite à mão.',
  geradoEm: new Date().toISOString().slice(0, 10),
  regioes: regioes.map(({ nome, cor, x, y }) => ({ nome, cor, x: Math.round(x), y: Math.round(y) })),
  nos, arestas,
};
fs.writeFileSync(new URL('../../dados/fios/universo.json', import.meta.url), JSON.stringify(saida));
console.log(`Pronto: ${nos.length} pontos (${nos.filter((n) => n.t === 'p').length} pessoas, ${nos.filter((n) => n.c).length} conferidos), ${arestas.length} fios, ${regioes.length} regiões.`);
for (const r of regioes) console.log(`  região ${r.n} itens: chave "${r.chave}" → ${r.nome}`);
