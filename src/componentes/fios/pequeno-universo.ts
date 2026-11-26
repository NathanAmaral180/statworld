// Pequeno universo de um item (Universo dos Fios, direção de arte v2 do Claude Design: design/fios/pequeno-universo-v2.html).
// O item fica no centro com a foto; o que veio antes (e está ligado a ele) fica de um lado, o que veio depois do outro.
// Celular: o tempo corre de cima para baixo. Computador: da esquerda para a direita.
// Ícones e cartão em HTML (fotos nítidas, acessíveis); fios e corrente elétrica num canvas 2D por baixo.
// "Antes" e "depois" vêm do ano de cada item (Wikidata) e dos fios do universo (links entre artigos da Wikipédia);
// não afirmam que um item causou o outro, só que estão ligados e qual é mais antigo.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/source-serif-4';
import './pequeno-universo.css';

export interface Opcoes {
  raiz: HTMLElement; // onde a camada é montada (o quadro do universo)
  nos: any[];
  viz: Set<number>[];
  regioes: any[];
  fotos: Record<string, { f: string; autor: string; lic: string; logo?: 1 }>;
  textos: Record<string, string>;
  caminho: number[]; // o mesmo "Seu caminho" do universo grande
  aoSair: (centro: number) => void;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const ano = (n: any): number | null => (n.t === 'p' ? n.nasc ?? null : n.a ?? null);
const anoTexto = (a: number | null) => (a == null ? '' : a < 0 ? `${(-a).toLocaleString('pt-BR')} a.C.` : String(a));
const urlFoto = (f: string, w: number) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f.replace(/ /g, '_'))}?width=${w}`;
const paginaFoto = (f: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, '_'))}`;

// moldura e tratamento da foto pela época do item
function epoca(n: any): { classe: string; rotulo: string } {
  const a = ano(n);
  if (a == null) return { classe: 'ep-neutra', rotulo: '' };
  if (a < 1800) return { classe: 'ep-gravura', rotulo: a < 0 ? 'ANTIGUIDADE' : a < 1500 ? 'IDADE MÉDIA' : `SÉC. ${romano(Math.floor(a / 100) + 1)}` };
  if (a < 1900) return { classe: 'ep-vitoriana', rotulo: 'SÉC. XIX' };
  if (a < 1945) return { classe: 'ep-deco', rotulo: 'SÉC. XX' };
  if (a < 1990) return { classe: 'ep-atomica', rotulo: 'SÉC. XX' };
  return { classe: 'ep-digital', rotulo: a < 2001 ? 'SÉC. XX' : 'SÉC. XXI' };
}
function romano(x: number) {
  const t: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of t) while (x >= v) { s += r; x -= v; }
  return s;
}

export function criarPequenoUniverso(o: Opcoes) {
  const { nos, viz, regioes, fotos, textos: T } = o;
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const celular = () => matchMedia('(max-width: 760px)').matches;
  const corDe = (n: any) => (n.t === 'p' ? '#dfe7f7' : regioes[n.r]?.cor ?? '#6ea8ff');

  const camada = document.createElement('div');
  camada.className = 'pu';
  camada.hidden = true;
  camada.innerHTML = `
    <div class="pu-ceu" aria-hidden="true"></div>
    <div class="pu-rolagem" tabindex="-1">
      <div class="pu-mapa"><canvas class="pu-fios" aria-hidden="true"></canvas><div class="pu-niveis"></div></div>
    </div>
    <div class="pu-topo">
      <button type="button" class="pu-sair" data-pu="sair"><span aria-hidden="true">←</span> ${esc(T.voltarAoUniverso)}</button>
      <button type="button" class="pu-meu-caminho" data-pu="caminho">${esc(T.seuCaminho)} <b></b></button>
    </div>
    <p class="pu-eixo pu-eixo-antes" aria-hidden="true">${esc(T.veioAntes)}</p>
    <p class="pu-eixo pu-eixo-depois" aria-hidden="true">${esc(T.veioDepois)}</p>
    <div class="pu-lista-caminho" hidden></div>
    <div class="pu-veu" hidden></div>
    <article class="pu-cartao" role="dialog" aria-modal="true" hidden></article>`;
  o.raiz.appendChild(camada);
  const $ = <E extends Element = HTMLElement>(s: string) => camada.querySelector<E>(s)!;
  const rolagem = $('.pu-rolagem');
  const mapa = $('.pu-mapa');
  const tela = $<HTMLCanvasElement>('.pu-fios');
  const niveisEl = $('.pu-niveis');

  let centro = -1;
  let niveis = new Map<number, number[]>(); // nível (−2…+2) → itens
  let pai = new Map<number, number>(); // item → por quem chegou (fio desenhado)
  let mostrarMais = new Set<number>(); // níveis abertos por inteiro
  let profundidade = { antes: 2, depois: 2 };
  let fios: { de: number; para: number; pts: [number, number][]; cor: [string, string] }[] = [];
  let quadro = 0;

  // ---------- Quem entra: busca em largura a partir do centro, separando o que é mais antigo e mais novo ----------
  const POR_NIVEL = () => (celular() ? 4 : 5);
  const importancia = (i: number) => (nos[i].c ? 100 : 0) + nos[i].s + (fotos[nos[i].id] ? 3 : 0);
  function montarNiveis() {
    niveis = new Map([[0, [centro]]]);
    pai = new Map();
    const usado = new Set([centro]);
    const a0 = ano(nos[centro]);
    for (const lado of [-1, 1] as const) {
      let fronteira = [centro];
      const prof = lado < 0 ? profundidade.antes : profundidade.depois;
      for (let k = 1; k <= prof; k++) {
        const cand = new Map<number, number>();
        for (const f of fronteira) {
          const af = ano(nos[f]) ?? a0;
          for (const v of viz[f]) {
            if (usado.has(v) || cand.has(v)) continue;
            const av = ano(nos[v]);
            if (av == null || af == null) continue;
            if (lado < 0 ? av < af : av > af) cand.set(v, f);
          }
        }
        if (!cand.size) break;
        const todos = [...cand.keys()].sort((x, y) => importancia(y) - importancia(x));
        const n = mostrarMais.has(lado * k) ? todos.length : POR_NIVEL();
        const escolhidos = todos.slice(0, n).sort((x, y) => (ano(nos[x]) ?? 0) - (ano(nos[y]) ?? 0));
        for (const e of escolhidos) { usado.add(e); pai.set(e, cand.get(e)!); }
        niveis.set(lado * k, escolhidos);
        (niveis as any)[`resto${lado * k}`] = todos.length - escolhidos.length;
        fronteira = escolhidos;
      }
    }
  }
  const resto = (k: number): number => (niveis as any)[`resto${k}`] ?? 0;
  const temMais = (lado: -1 | 1) => {
    const ultimo = lado < 0 ? -profundidade.antes : profundidade.depois;
    const itens = niveis.get(ultimo);
    if (!itens?.length) return 0;
    let n = 0;
    for (const f of itens) for (const v of viz[f]) {
      const av = ano(nos[v]), af = ano(nos[f]);
      if (av != null && af != null && (lado < 0 ? av < af : av > af) && ![...niveis.values()].some((l) => l.includes(v))) n++;
    }
    return n;
  };

  // ---------- Ícone de um ponto ----------
  function icone(i: number, papel: 'centro' | 'vizinho' | 'longe') {
    const n = nos[i];
    const foto = fotos[n.id];
    const pessoa = n.t === 'p';
    const classes = ['pu-ic', `pu-${papel}`, pessoa ? 'pu-pessoa' : '', foto?.logo ? 'pu-marca' : '', n.c ? 'pu-conf' : '', epoca(n).classe].filter(Boolean).join(' ');
    const tam = papel === 'centro' ? 320 : 160;
    const img = foto
      ? `<img src="${esc(urlFoto(foto.f, tam))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
      : `<span class="pu-sem-foto">${esc(n.n.slice(0, 1))}</span>`;
    return `<button type="button" class="${classes}" data-pu-item="${i}" style="--cor:${corDe(n)}" aria-label="${esc(n.n)}${ano(n) != null ? ', ' + esc(anoTexto(ano(n))) : ''}">
      <span class="pu-disco">${img}</span>
      ${n.c ? '<span class="pu-check" aria-hidden="true">✓</span>' : ''}
      ${ano(n) != null ? `<span class="pu-ano">${esc(anoTexto(ano(n)))}</span>` : ''}
      ${papel === 'centro' ? '' : `<span class="pu-nome">${esc(n.n)}</span>`}
    </button>`;
  }

  function desenharNiveis() {
    const ks = [...niveis.keys()].sort((a, b) => a - b);
    const maisAntes = temMais(-1), maisDepois = temMais(1);
    const n = nos[centro];
    let html = '';
    if (maisAntes) html += `<button type="button" class="pu-puxar" data-pu="antes">${celular() ? '↑' : '◀'} ${esc(T.puxeParaTras)} · ${esc(T.mais)} ${maisAntes}</button>`;
    for (const k of ks) {
      if (k === 0) {
        html += `<div class="pu-nivel pu-nivel-0">${icone(centro, 'centro')}
          <div class="pu-titulo"><h2>${esc(n.n)}</h2><p>${esc([anoTexto(ano(n)), n.d].filter(Boolean).join(' · '))}</p></div></div>`;
        continue;
      }
      const r = resto(k);
      html += `<div class="pu-nivel" data-nivel="${k}">${niveis.get(k)!.map((i) => icone(i, Math.abs(k) === 1 ? 'vizinho' : 'longe')).join('')}${r > 0 ? `<button type="button" class="pu-resto" data-pu-abrir="${k}" aria-label="${esc(T.mais)} ${r}"><span>+${r}</span></button>` : ''}</div>`;
    }
    if (maisDepois) html += `<button type="button" class="pu-puxar" data-pu="depois">${celular() ? '↓' : '▶'} ${esc(T.puxeParaFrente)} · ${esc(T.mais)} ${maisDepois}</button>`;
    niveisEl.innerHTML = html;
    // fotos que não carregarem viram a moldura com a inicial (nunca um buraco)
    niveisEl.querySelectorAll('img').forEach((im) => im.addEventListener('error', () => {
      const d = im.parentElement!;
      d.innerHTML = `<span class="pu-sem-foto">${esc(nos[Number(d.closest<HTMLElement>('[data-pu-item]')!.dataset.puItem)].n.slice(0, 1))}</span>`;
    }, { once: true }));
    $('.pu-meu-caminho b').textContent = String(o.caminho.length);
    requestAnimationFrame(medirFios);
  }

  // ---------- Fios: curva cúbica entre os centros, tangente no eixo do tempo ----------
  function medirFios() {
    const caixa = mapa.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    tela.width = Math.round(mapa.scrollWidth * dpr);
    tela.height = Math.round(mapa.scrollHeight * dpr);
    tela.style.width = mapa.scrollWidth + 'px';
    tela.style.height = mapa.scrollHeight + 'px';
    const pos = new Map<number, [number, number]>();
    niveisEl.querySelectorAll<HTMLElement>('[data-pu-item]').forEach((el) => {
      const d = el.querySelector('.pu-disco')!.getBoundingClientRect();
      pos.set(Number(el.dataset.puItem), [d.left - caixa.left + d.width / 2, d.top - caixa.top + d.height / 2]);
    });
    const vertical = celular();
    const ligar = (a: number, b: number) => {
      // sempre do mais antigo para o mais novo (a corrente corre do passado para o futuro)
      const [de, para] = (ano(nos[a]) ?? 0) <= (ano(nos[b]) ?? 0) ? [a, b] : [b, a];
      const p0 = pos.get(de)!, p3 = pos.get(para)!;
      const d = vertical ? (p3[1] - p0[1]) * 0.5 : (p3[0] - p0[0]) * 0.5;
      const p1: [number, number] = vertical ? [p0[0], p0[1] + d] : [p0[0] + d, p0[1]];
      const p2: [number, number] = vertical ? [p3[0], p3[1] - d] : [p3[0] - d, p3[1]];
      const pts: [number, number][] = [];
      for (let s = 0; s <= 28; s++) {
        const t = s / 28, u = 1 - t;
        pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
      }
      fios.push({ de, para, pts, cor: [corDe(nos[de]), corDe(nos[para])] });
    };
    fios = [];
    const feitos = new Set<string>();
    for (const [filho, p] of pai) if (pos.has(filho) && pos.has(p)) { ligar(filho, p); feitos.add([filho, p].sort().join('-')); }
    // ligações laterais entre itens visíveis de níveis vizinhos (ex.: Google → Android)
    const vis = [...pos.keys()];
    for (const a of vis) for (const b of viz[a]) {
      if (a < b && pos.has(b) && !feitos.has([a, b].sort().join('-')) && fios.length < 48) ligar(a, b);
    }
    if (reduzir) desenhar(0);
  }

  function desenhar(t: number) {
    const ctx = tela.getContext('2d')!;
    const dpr = tela.width / Math.max(1, mapa.scrollWidth);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, tela.width, tela.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const f of fios) {
      const a = f.pts[0], b = f.pts.at(-1)!;
      const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, f.cor[0]);
      g.addColorStop(1, f.cor[1]);
      // três passadas: halo largo, meio, fio fino (direção de arte v2)
      for (const [w, al] of [[7, 0.06], [2.4, 0.22], [1.1, 0.8]] as const) {
        ctx.globalAlpha = al;
        ctx.strokeStyle = g;
        ctx.lineWidth = w;
        ctx.beginPath();
        f.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
    }
    if (!reduzir) {
      // corrente: 2 pulsos por fio, cabeça branca com cauda azul, do mais antigo para o mais novo
      fios.forEach((f, k) => {
        for (let p = 0; p < 2; p++) {
          const fase = ((t / 1000) * 0.36 + p / 2 + k * 0.137) % 1;
          const n = f.pts.length - 1;
          const cab = fase * n;
          for (let c = 0; c < 14; c++) {
            const pos = cab - c * 0.35;
            if (pos < 0) break;
            const i = Math.floor(pos), r = pos - i;
            const [x0, y0] = f.pts[i], [x1, y1] = f.pts[Math.min(n, i + 1)];
            ctx.globalAlpha = (1 - c / 14) * (c === 0 ? 1 : 0.55);
            ctx.fillStyle = c < 2 ? '#ffffff' : '#9fd0ff';
            ctx.beginPath();
            ctx.arc(x0 + (x1 - x0) * r, y0 + (y1 - y0) * r, c === 0 ? 2.4 : 1.8 * (1 - c / 14) + 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  function animar(t: number) {
    if (camada.hidden || document.hidden) { quadro = 0; return; }
    desenhar(t);
    quadro = requestAnimationFrame(animar);
  }
  const ligarAnimacao = () => { if (!reduzir && !quadro) quadro = requestAnimationFrame(animar); };
  document.addEventListener('visibilitychange', ligarAnimacao);

  // ---------- Cartão em papel ----------
  const cartao = $('.pu-cartao');
  const veu = $('.pu-veu');
  function abrirCartao(i: number) {
    const n = nos[i];
    const foto = fotos[n.id];
    const ep = epoca(n);
    const reg = n.t === 'p' ? T.pessoa : regioes[n.r]?.nome ?? '';
    const quando = n.t === 'p' ? [n.nasc, n.morte].filter((x: any) => x != null).join('–') : anoTexto(ano(n));
    const frase = n.c && n.resumo ? n.resumo : n.d ? n.d.charAt(0).toUpperCase() + n.d.slice(1) + '.' : '';
    const ligados = [...viz[i]].sort((a, b) => importancia(b) - importancia(a));
    cartao.innerHTML = `
      <button type="button" class="pu-fechar" data-pu="fechar" aria-label="${esc(T.fechar)}">×</button>
      <div class="pu-c-foto ${ep.classe} ${foto?.logo ? 'pu-marca' : ''} ${n.t === 'p' ? 'pu-pessoa' : ''}">
        ${ep.rotulo ? `<span class="pu-c-epoca">${esc(ep.rotulo)}</span>` : ''}
        ${foto ? `<img src="${esc(urlFoto(foto.f, 800))}" alt="${esc(n.n)}" referrerpolicy="no-referrer">` : `<span class="pu-c-sem">${esc(n.n)}</span>`}
      </div>
      <p class="pu-c-reg" style="--cor:${corDe(n)}">${esc(reg)}${n.t === 'p' ? '' : ' · ' + esc(T.criacao)}</p>
      ${quando ? `<p class="pu-c-ano">${esc(quando)}</p>` : ''}
      <h3>${esc(n.n)}</h3>
      ${frase ? `<p class="pu-c-frase">${esc(frase)}</p>` : ''}
      ${ligados.length ? `<p class="pu-c-lig"><b>${esc(T.ligadoA)}</b> ${ligados.slice(0, 3).map((v) => esc(nos[v].n)).join(' · ')}${ligados.length > 3 ? ` · +${ligados.length - 3}` : ''}</p>` : ''}
      ${n.c ? `<p class="pu-c-conf"><span aria-hidden="true">✓</span> ${esc(T.conferido)}</p>` : ''}
      <p class="pu-c-fonte">${esc(T.fonte)}: ${n.c && n.trilha ? `<a href="/fios/${esc(n.trilha)}#${esc(n.k)}">${esc(T.trilhaConferida)}</a>, ` : ''}<a href="https://www.wikidata.org/wiki/${esc(n.id)}" rel="noopener" target="_blank">Wikidata</a>${n.w ? `, <a href="${esc(n.w)}" rel="noopener" target="_blank">Wikipédia</a>` : ''}${foto ? ` · ${esc(T.foto)}: <a href="${esc(paginaFoto(foto.f))}" rel="noopener" target="_blank">${esc(foto.autor)}</a>, ${esc(foto.lic)}, Wikimedia Commons` : ''}</p>
      ${i !== centro ? `<button type="button" class="pu-seguir" data-pu-seguir="${i}">${esc(T.seguirPara)} ${esc(n.n)} <span aria-hidden="true">→</span></button>` : ''}`;
    cartao.hidden = false;
    veu.hidden = false;
    camada.classList.add('pu-com-cartao');
    cartao.scrollTop = 0;
    (cartao.querySelector('.pu-fechar') as HTMLElement).focus({ preventScroll: true });
  }
  function fecharCartao() {
    cartao.hidden = true;
    veu.hidden = true;
    camada.classList.remove('pu-com-cartao');
  }

  // ---------- Seu caminho ----------
  const lista = $('.pu-lista-caminho');
  function abrirCaminho() {
    lista.innerHTML = `<h3>${esc(T.seuCaminho)} <small>${o.caminho.length} ${esc(T.paradas)}</small></h3><ol>${o.caminho.map((c, k) => {
      const n = nos[c], foto = fotos[n.id];
      return `<li><button type="button" data-pu-ir="${c}" ${c === centro ? 'aria-current="step"' : ''}>
        <span class="pu-mini ${n.t === 'p' ? 'pu-pessoa' : ''} ${foto?.logo ? 'pu-marca' : ''}">${foto ? `<img src="${esc(urlFoto(foto.f, 96))}" alt="" referrerpolicy="no-referrer">` : esc(n.n.slice(0, 1))}</span>
        <span><b>${esc(n.n)}</b><small>${esc(anoTexto(ano(n)))}</small></span>
        <em>${c === centro ? esc(T.aqui) : `${esc(T.parada)} ${k + 1}`}</em></button></li>`;
    }).join('')}</ol>`;
    lista.hidden = !lista.hidden;
  }

  // ---------- Trocar o centro ----------
  function centrar(i: number, { guardar = true } = {}) {
    centro = i;
    mostrarMais = new Set();
    profundidade = { antes: 2, depois: 2 };
    if (guardar) {
      const k = o.caminho.indexOf(i);
      if (k >= 0) o.caminho.splice(k + 1); else o.caminho.push(i);
    }
    fecharCartao();
    lista.hidden = true;
    montarNiveis();
    desenharNiveis();
    // leva o centro para o meio da tela
    requestAnimationFrame(() => {
      const c = niveisEl.querySelector<HTMLElement>('.pu-nivel-0 .pu-disco');
      if (!c) return;
      const rc = c.getBoundingClientRect(), rr = rolagem.getBoundingClientRect();
      rolagem.scrollBy({ left: rc.left + rc.width / 2 - (rr.left + rr.width / 2), top: rc.top + rc.height / 2 - (rr.top + rr.height / 2), behavior: 'instant' as ScrollBehavior });
    });
    history.replaceState(null, '', `#${encodeURIComponent(nos[i].id)}+`);
  }

  camada.addEventListener('click', (e) => {
    const alvo = e.target as Element;
    const item = alvo.closest<HTMLElement>('[data-pu-item]');
    if (item) return abrirCartao(Number(item.dataset.puItem));
    const seguir = alvo.closest<HTMLElement>('[data-pu-seguir]');
    if (seguir) return centrar(Number(seguir.dataset.puSeguir));
    const ir = alvo.closest<HTMLElement>('[data-pu-ir]');
    if (ir) return centrar(Number(ir.dataset.puIr));
    const abrir = alvo.closest<HTMLElement>('[data-pu-abrir]');
    if (abrir) { mostrarMais.add(Number(abrir.dataset.puAbrir)); montarNiveis(); desenharNiveis(); return; }
    const acao = alvo.closest<HTMLElement>('[data-pu]')?.dataset.pu;
    if (acao === 'fechar') fecharCartao();
    if (acao === 'antes') { profundidade.antes++; montarNiveis(); desenharNiveis(); }
    if (acao === 'depois') { profundidade.depois++; montarNiveis(); desenharNiveis(); }
    if (acao === 'caminho') abrirCaminho();
    if (acao === 'sair') sair();
    if (alvo === veu) fecharCartao();
  });
  camada.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!cartao.hidden) fecharCartao(); else if (!lista.hidden) lista.hidden = true; else sair();
  });
  // arrastar o cartão para baixo fecha (celular)
  let y0: number | null = null;
  cartao.addEventListener('touchstart', (e) => { y0 = cartao.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  cartao.addEventListener('touchend', (e) => { if (y0 != null && e.changedTouches[0].clientY - y0 > 90) fecharCartao(); y0 = null; });
  let espera = 0;
  new ResizeObserver(() => { if (!camada.hidden) { cancelAnimationFrame(espera); espera = requestAnimationFrame(() => { montarNiveis(); desenharNiveis(); }); } }).observe(camada);

  // ---------- Entrar (mergulho) e sair ----------
  function entrar(i: number, origem?: { x: number; y: number }) {
    camada.hidden = false;
    camada.classList.remove('pu-saindo');
    if (!reduzir) {
      camada.style.setProperty('--ox', origem ? origem.x + 'px' : '50%');
      camada.style.setProperty('--oy', origem ? origem.y + 'px' : '50%');
      camada.classList.add('pu-entrando');
      setTimeout(() => camada.classList.remove('pu-entrando'), 1300);
    }
    centrar(i, { guardar: o.caminho.at(-1) !== i });
    ligarAnimacao();
    rolagem.focus({ preventScroll: true });
  }
  function sair() {
    const c = centro;
    fecharCartao();
    lista.hidden = true;
    const fim = () => { camada.hidden = true; camada.classList.remove('pu-saindo'); o.aoSair(c); };
    if (reduzir) return fim();
    camada.classList.add('pu-saindo');
    setTimeout(fim, 450);
  }

  return { entrar, sair, aberto: () => !camada.hidden };
}
