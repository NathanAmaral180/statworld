// Baixa as fotos reais dos pontos do Universo dos Fios (para o "pequeno universo").
// Para cada item de dados/fios/universo.json: a imagem principal no Wikidata (P18), ou o logo (P154) se não houver.
// Depois pega no Wikimedia Commons o autor e a licença de cada arquivo, para mostrar "Foto: autor, licença".
// Só entram arquivos com licença livre (Creative Commons ou domínio público).
// Gera dados/fios/fotos.json. Como rodar (na pasta statworld):  node scripts/fios-universo/fotos.mjs
import fs from 'node:fs';

const UA = { 'user-agent': 'StatWorld-prototipo/1.0 (projeto pessoal; contato pelo site)' };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(url) {
  for (let t = 0; t < 8; t++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.status === 429 || r.status >= 500) throw new Error(String(r.status));
      return await r.json();
    } catch {
      console.log(`  (a Wikimedia pediu calma; esperando ${t + 1} min)`);
      await pausa(60000 * (t + 1));
    }
  }
  throw new Error('A Wikimedia não respondeu depois de várias tentativas. Tente mais tarde.');
}
const blocos = (lista, n) => Array.from({ length: Math.ceil(lista.length / n) }, (_, i) => lista.slice(i * n, i * n + n));
const desfazer = (t) => { let x = t; for (let i = 0; i < 3; i++) x = x.replace(/&amp;/g, '&'); return x; };
const limpar = (html) => desfazer(String(html ?? '')).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const U = JSON.parse(fs.readFileSync(new URL('../../dados/fios/universo.json', import.meta.url), 'utf8'));
const ids = U.nos.map((n) => n.id).filter((id) => /^Q\d+$/.test(id));

// 1) qual arquivo de imagem cada item tem no Wikidata
const arquivoDe = {};
const marca = new Set(U.nos.filter((n) => /sistema operacional|software|programa|site|sítio|motor de busca|rede social|serviço|aplicativo|empresa|navegador|plataforma|linguagem de programação/i.test(n.d ?? '')).map((n) => n.id));
for (const b of blocos(ids, 50)) {
  const j = await pedir('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: b.join('|'), props: 'claims', format: 'json' }));
  for (const [q, e] of Object.entries(j.entities ?? {})) {
    const valor = (p) => e.claims?.[p]?.find((c) => c.rank !== 'deprecated')?.mainsnak?.datavalue?.value;
    const img = valor('P18');
    const logo = valor('P154');
    // marcas, programas e serviços: o logo diz mais que uma foto qualquer
    const ehMarca = marca.has(q);
    if (logo && (ehMarca || !img)) arquivoDe[q] = { f: logo, logo: true };
    else if (img) arquivoDe[q] = { f: img, logo: false };
  }
  process.stdout.write('.');
  await pausa(300);
}
console.log(`\n${Object.keys(arquivoDe).length} de ${ids.length} itens têm imagem no Wikidata`);

// 2) autor e licença no Commons
const info = {};
const arquivos = [...new Set(Object.values(arquivoDe).map((a) => a.f))];
for (const b of blocos(arquivos, 50)) {
  const j = await pedir('https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', prop: 'imageinfo', iiprop: 'extmetadata|mime', titles: b.map((f) => 'File:' + f).join('|'), format: 'json', formatversion: '2',
  }));
  const norm = Object.fromEntries((j.query?.normalized ?? []).map((x) => [x.to, x.from]));
  for (const p of j.query?.pages ?? []) {
    const m = p.imageinfo?.[0]?.extmetadata;
    if (!m) continue;
    const nome = (norm[p.title] ?? p.title).replace(/^File:/, '');
    info[nome] = { autor: limpar(m.Artist?.value), lic: limpar(m.LicenseShortName?.value), mime: p.imageinfo[0].mime };
  }
  process.stdout.write('.');
  await pausa(300);
}

// 3) junta e filtra só as licenças livres
const livre = (l) => /^(CC|Public domain|PD|No restrictions|GFDL|Attribution)/i.test(l ?? '');
const fotos = {};
let fora = 0;
for (const [q, a] of Object.entries(arquivoDe)) {
  const i = info[a.f] ?? info[a.f.replace(/_/g, ' ')];
  if (!i || !livre(i.lic) || !/^image\//.test(i.mime)) { fora++; continue; }
  fotos[q] = { f: a.f, autor: (i.autor || 'autor desconhecido').slice(0, 80), lic: i.lic, ...(a.logo ? { logo: 1 } : {}) };
}
console.log(`\n${Object.keys(fotos).length} fotos com licença livre (${fora} ficaram de fora)`);

fs.writeFileSync(new URL('../../dados/fios/fotos.json', import.meta.url), JSON.stringify({
  _explicacao: 'Fotos dos pontos do Universo dos Fios: arquivo do Wikimedia Commons (imagem principal P18 ou logo P154 do Wikidata), autor e licença. Gerado por scripts/fios-universo/fotos.mjs; não edite à mão.',
  geradoEm: new Date().toISOString().slice(0, 10),
  fotos,
}));
