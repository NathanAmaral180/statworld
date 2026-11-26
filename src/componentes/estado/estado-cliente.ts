// Página de estado no navegador: mapa dos municípios com zoom, busca, filtro por região, ranking longo e ficha.
// Segue o design da rodada 5 (design/rodada-5-estado/codigo/molde-estado.js). Todos os números chegam prontos
// do servidor (src/lib/estado.ts) num <script type="application/json">; aqui só se desenha.

type Mun = { n: string; d: string; c: [number, number]; b: [number, number, number, number]; a: number; r: string };
type Medida = {
  id: string; rotulo: string; coluna: string; titulo: string; subtitulo: string; carimbo: string; frequencia: string;
  fmt: { formato: 'percentual' | 'moeda' | 'numero'; casas: number; compacto?: boolean; sinal?: boolean }; moeda: string;
  cortes: number[]; legenda: string[]; valores: Record<string, number | null>; textos: Record<string, string>;
  posBrasil: Record<string, number | null> | null; totalBrasil: number | null; ref: { rotulo: string; valor: number; texto: string } | null;
  observacao?: string; divergente?: boolean;
};
type Dados = {
  w: number; h: number; mun: Record<string, Mun>; regioes: Record<string, { n: string; count: number; b: number[] }>; regB: string;
  capital: string; inicial: string; idioma: string; medidas: Medida[]; t: Record<string, string>; nivel: { singular: string; plural: string; Singular: string };
  emEstado: string; deEstado: string; bandeiras?: Record<string, { a: string; c: string; p: string }>; nomePais: string; totalPais: number; fonteRegioes: string; fonteMalha: string;
};

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const norm = (s: string) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const isMob = () => matchMedia('(max-width:640px)').matches;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => (k in v ? String(v[k]) : `{${k}}`));
const CHEV = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const ICONES: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
};
const ic = (k: string) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[k]}</svg>`;

/* ---------- mapa com zoom ---------- */
type V = { x: number; y: number; w: number; h: number };
class Mapa {
  G: Dados; o: any; id: string; codes: string[]; lab: { sel?: string } = {}; frame!: HTMLElement; svg!: SVGSVGElement; pick!: HTMLElement; host: HTMLElement;
  paths: Record<string, SVGPathElement> = {}; v!: V; base!: V; fw = 0; fh = 0; ar = 1; raf = 0; wt: any; fim: any;
  constructor(el: HTMLElement, G: Dados, o: any) {
    this.G = G; this.o = o; this.host = el; this.id = 'hm' + Math.random().toString(36).slice(2, 7); this.codes = Object.keys(G.mun);
    el.innerHTML = `<div class="mm">
      <svg viewBox="0 0 ${G.w} ${G.h}" tabindex="0" role="img" aria-roledescription="mapa" aria-label="${esc(o.aria)}. Setas movem, mais e menos aproximam. Para escolher pelo teclado, use a busca ou o ranking.">
       <defs><pattern id="${this.id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:var(--bg)"/><line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--hatch);stroke-width:1.4"/></pattern></defs>
       <g class="g-m">${this.codes.map((c) => `<path class="mu" data-c="${c}" d="${G.mun[c].d}"></path>`).join('')}</g>
       <path class="rb" d="${G.regB}"/>
       <path class="hov" d=""/><path class="sel2" d=""/><path class="sel" d=""/><g class="g-lab"></g>
      </svg>
      <div class="mm-z" role="group" aria-label="Zoom do mapa">
        <button type="button" data-z="in" aria-label="Aproximar" title="Aproximar">+</button>
        <button type="button" data-z="out" aria-label="Afastar" title="Afastar">−</button>
        <button type="button" data-z="fit" aria-label="Ver o estado inteiro" title="Ver o estado inteiro">${ic('fit')}</button>
      </div>
      <div class="mm-pick" hidden role="dialog" aria-label="Cidades neste ponto"></div>
    </div>`;
    this.frame = el.querySelector('.mm')!; this.svg = el.querySelector('svg')!; this.pick = el.querySelector('.mm-pick')!;
    this.svg.querySelectorAll<SVGPathElement>('.mu').forEach((p) => (this.paths[p.dataset.c!] = p));
    this.size(); new ResizeObserver(() => this.size()).observe(el);
    el.querySelector('.mm-z')!.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button'); if (!b) return;
      const z = b.dataset.z; if (z === 'fit') this.fit(); else this.zoom(z === 'in' ? 2 : 0.5);
    });
    this.bindPointer(); this.bindKeys();
    this.pick.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button'); if (!b) return;
      if (b.dataset.c) o.onClick(b.dataset.c, 'pick'); this.closePick();
    });
  }
  size() {
    const G = this.G, fw = this.host.clientWidth || 800, mob = isMob();
    const fh = Math.round(Math.max(mob ? 300 : 360, Math.min((fw * G.h) / G.w, mob ? 460 : 640)));
    this.frame.style.height = fh + 'px'; this.fw = fw; this.fh = fh; this.ar = fw / fh;
    this.base = this.box([0, 0, G.w, G.h], 0.02, 0);
    if (!this.v || this.k() <= 1.001) this.v = this.base;
    else { const cx = this.v.x + this.v.w / 2, cy = this.v.y + this.v.h / 2, w = this.v.w; this.v = this.clamp({ x: cx - w / 2, y: cy - w / this.ar / 2, w, h: w / this.ar }); }
    this.apply(); this.labels();
  }
  k() { return this.base.w / this.v.w; }
  box(b: number[], pad: number, minW: number): V {
    const bw = b[2] - b[0], bh = b[3] - b[1];
    const w = Math.max(bw * (1 + 2 * pad), bh * (1 + 2 * pad) * this.ar, minW), h = w / this.ar;
    return { x: (b[0] + b[2]) / 2 - w / 2, y: (b[1] + b[3]) / 2 - h / 2, w, h };
  }
  clamp(v: V): V {
    const B = this.base, minW = B.w / 28; const w = Math.min(B.w, Math.max(minW, v.w)), h = w / this.ar;
    if (w >= B.w - 1e-6) return { ...B };
    let cx = v.x + v.w / 2, cy = v.y + v.h / 2; cx = Math.max(0, Math.min(this.G.w, cx)); cy = Math.max(0, Math.min(this.G.h, cy));
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }
  apply() {
    const v = this.v; this.svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
    const z = this.k() > 1.01; this.frame.classList.toggle('zoomed', z);
    const q = (s: string) => this.host.querySelector<HTMLButtonElement>(`[data-z="${s}"]`)!;
    q('out').disabled = !z; q('fit').disabled = !z; q('in').disabled = this.v.w <= this.base.w / 28 + 1e-6;
  }
  to(t: V, anim = true) {
    t = this.clamp(t); cancelAnimationFrame(this.raf);
    if (!anim || calm() || document.hidden) { this.v = t; this.apply(); this.labels(); return; }
    const f = { ...this.v }, t0 = performance.now(), D = 360;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
      this.v = { x: f.x + (t.x - f.x) * e, y: f.y + (t.y - f.y) * e, w: f.w + (t.w - f.w) * e, h: f.h + (t.h - f.h) * e }; this.apply();
      if (p < 1) this.raf = requestAnimationFrame(step); else this.labels();
    };
    this.labels(true); this.raf = requestAnimationFrame(step);
    // Garantia: se o navegador não rodar a animação (aba em segundo plano, aparelho lento), o zoom chega mesmo assim.
    clearTimeout(this.fim); const alvo = t; this.fim = setTimeout(() => { if (this.v.w !== alvo.w || this.v.x !== alvo.x) { cancelAnimationFrame(this.raf); this.v = alvo; this.apply(); this.labels(); } }, D + 200);
  }
  zoom(f: number, cx?: number, cy?: number) {
    const v = this.v; if (cx == null) { cx = v.x + v.w / 2; cy = v.y + v.h / 2; }
    this.to({ x: cx - (cx - v.x) / f, y: cy! - (cy! - v.y) / f, w: v.w / f, h: v.h / f });
  }
  fit(anim = true) { this.to(this.base, anim); }
  fitBox(b: number[], anim = true) { this.to(this.box(b, 0.06, 0), anim); }
  focus(c: string, anim = true) { const m = this.G.mun[c]; if (!m) return; this.to(this.box(m.b, 0.9, this.base.w / 9), anim); }
  pt(cx: number, cy: number) { const r = this.svg.getBoundingClientRect(), v = this.v; return [v.x + ((cx - r.left) / r.width) * v.w, v.y + ((cy - r.top) / r.height) * v.h]; }
  bindPointer() {
    const svg = this.svg, P = new Map<number, { x: number; y: number }>(); let s: any = null, moved = false, pinch: any = null;
    const hit = (e: Event) => { const t = (e.target as Element).closest?.('.mu') as SVGPathElement | null; return t && !t.classList.contains('out') ? t.dataset.c! : null; };
    svg.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse' && !P.size) this.o.onHover(hit(e)); });
    svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.o.onHover(null); });
    svg.addEventListener('pointerdown', (e) => {
      P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (P.size === 1) { s = { x: e.clientX, y: e.clientY, v: { ...this.v }, type: e.pointerType, c: hit(e) }; moved = false; }
      if (P.size === 2) { const [a, b] = [...P.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, v: { ...this.v }, m: this.pt((a.x + b.x) / 2, (a.y + b.y) / 2) }; moved = true; cancelAnimationFrame(this.raf); }
    });
    svg.addEventListener('pointermove', (e) => {
      if (!P.has(e.pointerId)) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = svg.getBoundingClientRect();
      if (P.size === 2 && pinch) {
        e.preventDefault(); const [a, b] = [...P.values()], f = Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, w = pinch.v.w / f, h = w / this.ar;
        const mx = ((a.x + b.x) / 2 - r.left) / r.width, my = ((a.y + b.y) / 2 - r.top) / r.height;
        this.v = this.clamp({ x: pinch.m[0] - mx * w, y: pinch.m[1] - my * h, w, h }); this.apply(); return;
      }
      if (P.size === 1 && s) {
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (!moved && Math.hypot(dx, dy) > 5 && this.k() > 1.01) { moved = true; this.frame.classList.add('drag'); try { svg.setPointerCapture(e.pointerId); } catch { /* */ } }
        if (moved) { this.v = this.clamp({ ...s.v, x: s.v.x - (dx / r.width) * s.v.w, y: s.v.y - (dy / r.height) * s.v.h }); this.apply(); }
      }
    });
    const up = (e: PointerEvent) => {
      if (!P.has(e.pointerId)) return; P.delete(e.pointerId); this.frame.classList.remove('drag');
      if (P.size === 1) { pinch = null; const [a] = [...P.values()]; s = { x: a.x, y: a.y, v: { ...this.v }, type: 'touch' }; return; }
      if (P.size === 0) { if (!moved && s && e.type === 'pointerup') this.tap(e, s); else this.labels(); s = null; pinch = null; }
    };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('dblclick', (e) => { const [x, y] = this.pt(e.clientX, e.clientY); this.zoom(2, x, y); });
    svg.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const [x, y] = this.pt(e.clientX, e.clientY); cancelAnimationFrame(this.raf);
      const f = Math.exp(-e.deltaY * 0.004), v = this.v, w = v.w / f; this.v = this.clamp({ x: x - (x - v.x) / f, y: y - (y - v.y) / f, w, h: w / this.ar }); this.apply();
      clearTimeout(this.wt); this.wt = setTimeout(() => this.labels(), 120);
    }, { passive: false });
  }
  tap(e: PointerEvent, s: any) {
    const c = s.c; if (s.type === 'mouse') { if (c) this.o.onClick(c, 'map'); return; }
    // toque: se houver várias cidades pequenas sob o dedo, abre a lista do ponto
    const [x, y] = this.pt(e.clientX, e.clientY), R = (18 * this.v.w) / this.fw, M = this.G.mun;
    const near = this.codes.filter((k) => !this.paths[k].classList.contains('out'))
      .map((k) => { const b = M[k].b, dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); return [k, Math.hypot(dx, dy) + (k === c ? 0 : 0.001)] as [string, number]; })
      .filter(([, d]) => d <= R).sort((a, b) => a[1] - b[1]).map(([k]) => k)
      .filter((k) => k === c || ((M[k].b[2] - M[k].b[0]) / this.v.w) * this.fw < 44);
    if (c && !near.includes(c)) near.unshift(c);
    if (near.length > 1) this.openPick(near.slice(0, 6)); else if (c) this.o.onClick(c, 'map');
  }
  openPick(list: string[]) {
    const M = this.G.mun, R = this.G.regioes;
    this.pick.innerHTML = `<div class="mm-pick-h"><span>${list.length} cidades neste ponto</span><button type="button" class="fld-x" aria-label="Fechar">${ic('x')}</button></div>
      <ul>${list.map((k) => `<li><button type="button" data-c="${k}">${esc(M[k].n)}<span>${esc(R[M[k].r].n)}</span></button></li>`).join('')}</ul>`;
    this.pick.hidden = false; this.pick.querySelector<HTMLButtonElement>('li button')?.focus({ preventScroll: true });
  }
  closePick() { this.pick.hidden = true; }
  bindKeys() {
    this.svg.addEventListener('keydown', (e) => {
      const v = this.v, d = v.w * 0.12;
      const mv = ({ ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] } as Record<string, number[]>)[e.key];
      if (mv) { e.preventDefault(); this.to({ ...v, x: v.x + mv[0], y: v.y + mv[1] }); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoom(2); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoom(0.5); }
      else if (e.key === '0') { e.preventDefault(); this.fit(); }
      else if (e.key === 'Escape') this.closePick();
    });
    this.pick.addEventListener('keydown', (e) => { if (e.key === 'Escape') { this.closePick(); this.svg.focus(); } });
  }
  update(f: (c: string) => { out?: boolean; hatch?: boolean; f?: string }) {
    for (const c of this.codes) { const r = f(c), p = this.paths[c]; p.classList.toggle('out', !!r.out); p.style.fill = r.out ? '' : r.hatch ? `url(#${this.id})` : r.f!; }
  }
  mark(sel: string, hov: string | null) {
    const M = this.G.mun, q = (s: string) => this.svg.querySelector(s)!; const d = sel && M[sel] ? M[sel].d : '';
    q('.sel').setAttribute('d', d); q('.sel2').setAttribute('d', d); q('.hov').setAttribute('d', hov && hov !== sel && M[hov] ? M[hov].d : '');
    if (sel !== this.lab.sel) { this.lab.sel = sel; this.labels(); }
  }
  labels(hide?: boolean) {
    const g = this.svg.querySelector<SVGGElement>('.g-lab')!; if (hide) { g.style.opacity = '0'; return; } g.style.opacity = '1';
    const M = this.G.mun, v = this.v, s = v.w / this.fw, fs = 13 * s, sel = this.lab.sel, cap = this.o.capital, boxes: number[][] = []; let h = '';
    const inView = ([x, y]: number[]) => x > v.x && x < v.x + v.w && y > v.y && y < v.y + v.h;
    const fits = (x: number, y: number, w: number) => { const b = [x - w / 2, y - fs, x + w / 2, y + fs * 0.3]; if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) return false; boxes.push(b); return true; };
    const tw = (n: string) => n.length * fs * 0.56;
    const put = (c: string, cls: string, dy = 0) => { const m = M[c]; if (!m || !inView(m.c)) return; const y = m.c[1] + dy, w = tw(m.n); if (!fits(m.c[0], y, w)) return;
      h += `<text class="ml ${cls}" x="${m.c[0]}" y="${y}" text-anchor="middle" style="font-size:${fs}px;stroke-width:${3.2 * s}px">${esc(m.n)}</text>`; };
    if (sel && M[sel]) { const m = M[sel]; put(sel, 's', -(m.c[1] - m.b[1]) - 6 * s); }
    if (cap && M[cap] && !this.paths[cap].classList.contains('out')) { const m = M[cap]; if (inView(m.c)) { h += `<circle class="cap" cx="${m.c[0]}" cy="${m.c[1]}" r="${3.5 * s}"/>`; if (cap !== sel) put(cap, '', -7 * s); } }
    if (this.k() >= 2.2) {
      this.codes.filter((c) => c !== sel && c !== cap && !this.paths[c].classList.contains('out') && inView(M[c].c) && (M[c].b[2] - M[c].b[0]) / s > (tw(M[c].n) / s) * 0.9)
        .sort((a, b) => M[b].a - M[a].a).slice(0, 40).forEach((c) => put(c, '', fs * 0.35));
    }
    g.innerHTML = h;
  }
}

/* ---------- busca (combobox) ---------- */
class Busca {
  o: any; id: string; el: HTMLDivElement; inp: HTMLInputElement; list: HTMLUListElement; x: HTMLButtonElement; m: any[] = []; q = ''; act = -1;
  constructor(o: { items: { c: string; n: string; sub: string; k?: string }[]; onPick: (c: string) => void; label: string; placeholder: string; empty: string }) {
    this.o = o; const id = (this.id = 'cb' + Math.random().toString(36).slice(2, 7));
    o.items.forEach((i) => (i.k = norm(i.n)));
    const el = (this.el = document.createElement('div')); el.className = 'cb';
    el.innerHTML = `<label class="sr" for="${id}i">${esc(o.label)}</label><div class="fld">${ic('search')}<input id="${id}i" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}l" autocomplete="off" spellcheck="false" placeholder="${esc(o.placeholder)}"><button type="button" class="fld-x" aria-label="Limpar busca" hidden>${ic('x')}</button></div><ul class="cb-l" id="${id}l" role="listbox" aria-label="Resultados" hidden></ul>`;
    this.inp = el.querySelector('input')!; this.list = el.querySelector('ul')!; this.x = el.querySelector('.fld-x')!;
    this.inp.addEventListener('input', () => this.run());
    this.inp.addEventListener('focus', () => { if (this.inp.value.trim()) this.run(); });
    this.inp.addEventListener('blur', () => setTimeout(() => { if (!el.contains(document.activeElement)) this.close(); }, 120));
    this.inp.addEventListener('keydown', (e) => {
      const n = this.m.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (this.list.hidden) return this.run(); if (!n) return; this.act = (this.act + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; this.paint(); }
      else if (e.key === 'Enter') { if (!this.list.hidden && this.act >= 0) { e.preventDefault(); this.pick(this.act); } }
      else if (e.key === 'Escape') { if (!this.list.hidden) { e.preventDefault(); this.close(); } else { this.inp.value = ''; this.x.hidden = true; } }
    });
    this.list.addEventListener('pointerdown', (e) => e.preventDefault());
    this.list.addEventListener('click', (e) => { const li = (e.target as Element).closest<HTMLElement>('li[data-i]'); if (li) this.pick(+li.dataset.i!); });
    this.x.addEventListener('click', () => { this.inp.value = ''; this.x.hidden = true; this.close(); this.inp.focus(); });
  }
  run() {
    const q = norm(this.inp.value.trim()); this.x.hidden = !q; if (!q) { this.close(); return; }
    const it = this.o.items, a = it.filter((i: any) => i.k.startsWith(q)), b = it.filter((i: any) => !i.k.startsWith(q) && i.k.includes(q));
    this.m = [...a, ...b].slice(0, 8); this.q = q; this.act = this.m.length ? 0 : -1; this.paint();
  }
  paint() {
    const q = this.q, id = this.id;
    this.list.innerHTML = this.m.length
      ? this.m.map((i, j) => { const p = i.k.indexOf(q), nm = p < 0 ? esc(i.n) : esc(i.n.slice(0, p)) + '<b>' + esc(i.n.slice(p, p + q.length)) + '</b>' + esc(i.n.slice(p + q.length));
          return `<li id="${id}o${j}" role="option" data-i="${j}" aria-selected="${j === this.act}" class="${j === this.act ? 'act' : ''}"><span class="nm">${nm}</span><small>${esc(i.sub)}</small></li>`; }).join('')
      : `<li class="cb-e" role="option" aria-disabled="true">${esc(this.o.empty)}</li>`;
    this.list.hidden = false; this.inp.setAttribute('aria-expanded', 'true');
    if (this.act >= 0) this.inp.setAttribute('aria-activedescendant', `${id}o${this.act}`); else this.inp.removeAttribute('aria-activedescendant');
  }
  close() { this.list.hidden = true; this.inp.setAttribute('aria-expanded', 'false'); this.inp.removeAttribute('aria-activedescendant'); }
  pick(j: number) { const i = this.m[j]; if (!i) return; this.inp.value = i.n; this.close(); this.o.onPick(i.c); }
}

/* ---------- ranking longo ---------- */
class Ranking {
  el: HTMLElement; o: any; n = 0; body: HTMLElement; srch: HTMLElement; hid: string; st: any; sorted: any[] = [];
  constructor(el: HTMLElement, o: any) {
    this.el = el; this.o = o; const id = 'rk' + Math.random().toString(36).slice(2, 7);
    el.innerHTML = `<div class="rk-tools"><div class="rk-srch"></div><div class="rk-top"><h3 class="sec-h" id="${id}h">Ranking</h3>
      <div class="seg sm" role="radiogroup" aria-label="Ordem do ranking"><button type="button" role="radio" data-act="desc">Maiores</button><button type="button" role="radio" data-act="asc">Menores</button></div></div></div><div class="rk-body"></div>`;
    this.body = el.querySelector('.rk-body')!; this.srch = el.querySelector('.rk-srch')!; this.hid = id + 'h';
    el.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const li = (e.target as Element).closest<HTMLElement>('li[data-c]'); if (li) o.onHover(li.dataset.c); });
    this.body.addEventListener('mouseleave', () => o.onHover(null));
    el.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-act]'); if (b) return this.act(b.dataset.act!);
      const li = (e.target as Element).closest<HTMLElement>('li[data-c]'); if (li) o.onClick(li.dataset.c, 'rank');
    });
    el.addEventListener('keydown', (e) => {
      const li = (e.target as Element).closest<HTMLElement>('li[data-c]'); if (!li) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onClick(li.dataset.c, 'rank'); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const all = [...this.body.querySelectorAll<HTMLElement>('li[data-c]')]; let i = all.indexOf(li);
      i = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : Math.max(0, Math.min(all.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
      all.forEach((x) => (x.tabIndex = -1)); all[i].tabIndex = 0; all[i].focus(); o.onHover(all[i].dataset.c);
    });
  }
  act(a: string) {
    const st = this.st;
    if (a === 'desc' || a === 'asc') { if (st.ord !== a) this.o.onOrder(a); return; }
    if (a === 'more') this.n = this.n ? this.n + 50 : 50;
    if (a === 'less') this.n = 0;
    if (a === 'goto') {
      const i = this.sorted.findIndex((r) => r.c === st.sel); if (i < 0) return;
      if (!this.n || this.n <= i) this.n = Math.ceil((i + 1) / 50) * 50; this.render(st); this.scrollTo(st.sel, true); return;
    }
    this.render(st);
  }
  scrollTo(c: string, focus: boolean) {
    const li = this.body.querySelector<HTMLElement>(`li[data-c="${c}"]`); if (!li) return;
    const y = li.getBoundingClientRect().top + window.scrollY - Math.round(innerHeight * 0.4);
    window.scrollTo({ top: y, behavior: calm() ? 'auto' : 'smooth' }); if (focus) setTimeout(() => li.focus({ preventScroll: true }), calm() ? 0 : 400);
  }
  render(st: any) {
    this.st = st; const M = this.o.G.mun, nm = (c: string) => M[c].n;
    this.el.querySelectorAll<HTMLElement>('[role=radio]').forEach((b) => { const on = b.dataset.act === st.ord; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    const val = st.rows.filter((r: any) => r.v != null).sort((a: any, b: any) => b.v - a.v);
    const nul = st.rows.filter((r: any) => r.v == null).sort((a: any, b: any) => nm(a.c).localeCompare(nm(b.c), 'pt'));
    val.forEach((r: any, i: number) => (r.pos = i + 1));
    const sorted = (this.sorted = (st.ord === 'asc' ? [...val].reverse() : val).concat(nul)), N = sorted.length;
    // Barras começam no zero (negativos vão para a esquerda), como no ranking do Brasil.
    const lo = Math.min(0, ...val.map((r: any) => r.v)), hi = Math.max(0, ...val.map((r: any) => r.v)), fx = hi - lo || 1, z = ((0 - lo) / fx) * 100;
    const bar = (v: number) => { const p = ((v - lo) / fx) * 100; return `left:${Math.min(z, p).toFixed(2)}%;width:${Math.max(Math.abs(p - z), 0.6).toFixed(2)}%`; };
    const row = (r: any) => {
      const nd = r.v == null, on = r.c === st.sel;
      return `<li data-c="${r.c}" role="option" tabindex="${on ? 0 : -1}" aria-selected="${on}" class="${on ? 'on' : ''} ${r.c === st.hov ? 'hv' : ''}"><span class="n">${nd ? '—' : r.pos}</span><span class="nm">${esc(nm(r.c))}</span><span class="bar ${nd ? 'h' : ''}">${nd ? '' : `<i style="${bar(r.v)}"></i>`}</span><span class="v ${nd ? 'nd' : ''}">${esc(r.txt)}</span></li>`;
    };
    const TOP = N <= 15 ? N : 10, si = sorted.findIndex((r: any) => r.c === st.sel); let list;
    if (!this.n) { list = sorted.slice(0, TOP).map(row).join(''); if (si >= TOP) list += `<li class="gap" aria-hidden="true">···</li>` + row(sorted[si]); }
    else list = sorted.slice(0, this.n).map(row).join('');
    const shown = this.n ? Math.min(this.n, N) : TOP, u = this.o.units;
    const rs = si >= 0 ? sorted[si] : null;
    const pin = this.n && rs ? `<div class="rk-pin" role="status"><small>Sua cidade</small><b>${esc(nm(st.sel))}</b><span>${rs.v == null ? 'sem dado nesta medida' : `${rs.pos}º de ${val.length} ${esc(st.scope)}`}</span><button type="button" class="lk" data-act="goto">Ir para a posição</button></div>` : '';
    let more = '';
    if (N > TOP) {
      more = this.n
        ? `<div>${shown < N ? `<button class="more" type="button" data-act="more">Mostrar mais ${Math.min(50, N - shown)}</button>` : ''}<button class="more" type="button" data-act="less">Recolher</button></div><span>${shown < N ? `1 a ${shown} de ${N}` : `Todos os ${N}`}</span>`
        : `<button class="more" type="button" data-act="more" aria-expanded="false">Ver todos os ${N} ${u}</button><span>${st.ord === 'asc' ? 'Do menor para o maior' : ''}</span>`;
    }
    this.body.innerHTML = `${pin}<div class="rk-h"><span>${this.o.Unit}</span><span>${esc(st.col)}</span></div>
      <ul class="rk" role="listbox" aria-labelledby="${this.hid}">${list}</ul>${more ? `<div class="rk-more">${more}</div>` : ''}`;
  }
}

/* ---------- troca de estado na trilha ---------- */
function trocaDeEstado(wrap: HTMLElement) {
  const b = wrap.querySelector<HTMLButtonElement>('.pk-b')!, pop = wrap.querySelector<HTMLElement>('.pk-pop')!, inp = pop.querySelector('input')!;
  const itens = [...pop.querySelectorAll<HTMLElement>('[data-nome]')], grupos = [...pop.querySelectorAll<HTMLElement>('[role=group]')], vazio = pop.querySelector<HTMLElement>('.pk-e')!;
  const paint = () => {
    const q = norm(inp.value.trim());
    itens.forEach((a) => (a.hidden = !!q && !norm(a.dataset.nome!).includes(q) && a.dataset.uf!.toLowerCase() !== q));
    grupos.forEach((g) => (g.hidden = ![...g.querySelectorAll<HTMLElement>('[data-nome]')].some((a) => !a.hidden)));
    vazio.hidden = itens.some((a) => !a.hidden);
  };
  const open = (o: boolean) => { pop.hidden = !o; b.setAttribute('aria-expanded', String(o)); if (o) paint(); };
  b.addEventListener('click', () => { const o = pop.hidden; open(o); if (o) inp.focus({ preventScroll: true }); });
  inp.addEventListener('input', paint);
  pop.addEventListener('keydown', (e) => {
    const as = [...pop.querySelectorAll<HTMLAnchorElement>('a[data-nome]')].filter((a) => !a.hidden), i = as.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'Escape') { open(false); b.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); (as[i + 1] || as[0])?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) inp.focus(); else as[i - 1].focus(); }
    else if (e.key === 'Enter' && e.target === inp && as[0]) location.href = as[0].href;
  });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target as Node)) open(false); });
}

/* ---------- página com mapa dos municípios ---------- */
function paginaMunicipios(root: HTMLElement, G: Dados) {
  const $ = (id: string) => root.querySelector<HTMLElement>('#' + id)!;
  const live = root.querySelector<HTMLElement>('.est-live')!;
  const t = G.t, ms = G.medidas, codes = Object.keys(G.mun), R = G.regioes, nAll = codes.length;
  const Q = new URLSearchParams(location.hash.slice(1));
  const st = {
    m: ms.some((x) => x.id === Q.get('m')) ? Q.get('m')! : ms[0].id,
    sel: G.mun[Q.get('cidade') ?? ''] ? Q.get('cidade')! : G.inicial,
    hov: null as string | null, reg: R[Q.get('regiao') ?? ''] ? Q.get('regiao')! : '', ord: 'desc',
  };
  const inReg = (c: string) => !st.reg || G.mun[c].r === st.reg;
  // Guarda a escolha no endereço (dá para mandar o link de uma cidade).
  const salvar = () => { const p = new URLSearchParams(); if (st.m !== ms[0].id) p.set('m', st.m); p.set('cidade', st.sel); if (st.reg) p.set('regiao', st.reg); history.replaceState(null, '', '#' + p.toString()); };

  // Região: select nativo (teclado e leitor de tela de graça).
  const regWrap = document.createElement('div'); regWrap.className = 'sel-w';
  const rid = 'reg' + Math.random().toString(36).slice(2, 6);
  regWrap.innerHTML = `<label class="sr" for="${rid}">Região do estado</label><select id="${rid}"><option value="">${esc(fill(t.todoEstado, { n: nAll }))}</option>${Object.entries(R).sort((a, b) => a[1].n.localeCompare(b[1].n, 'pt')).map(([k, r]) => `<option value="${k}">${esc(fill(t.regiao, { nome: r.n, n: r.count }))}</option>`).join('')}</select>${CHEV}`;
  const regSel = regWrap.querySelector('select')!; regSel.value = st.reg;
  const clr = document.createElement('button'); clr.type = 'button'; clr.className = 'lk'; clr.textContent = t.verEstadoInteiro;
  const busca = new Busca({
    label: fill(t.buscarRotulo, { emEstado: G.emEstado }), placeholder: t.buscar, empty: fill(t.buscaVazia, { emEstado: G.emEstado }),
    items: codes.map((c) => ({ c, n: G.mun[c].n, sub: R[G.mun[c].r].n })).sort((a, b) => a.n.localeCompare(b.n, 'pt')), onPick: (c) => pick(c, 'search'),
  });
  const mapa = new Mapa($('est-mapa'), G, { aria: `Mapa dos ${nAll} ${G.nivel.plural} ${G.deEstado}`, capital: G.capital, onHover: (c: string | null) => { st.hov = c; draw(); }, onClick: (c: string, from: string) => pick(c, from) });
  const rank = new Ranking($('est-rank'), { G, Unit: G.nivel.Singular, units: G.nivel.plural, onHover: (c: string | null) => { st.hov = c; draw(); }, onClick: (c: string) => pick(c, 'rank'), onOrder: (o: string) => { st.ord = o; draw(); } });
  const place = () => { const mt = $('est-mtools'); mt.append(regWrap, clr); if (isMob()) mt.prepend(busca.el); else rank.srch.append(busca.el); $('est-dica').textContent = isMob() ? t.dicaCel : t.dicaPc; };
  place(); matchMedia('(max-width:640px)').addEventListener('change', place);
  regSel.addEventListener('change', () => setReg(regSel.value));
  clr.addEventListener('click', () => { regSel.value = ''; setReg(''); });
  root.addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('[data-reg]'); if (b) { regSel.value = b.dataset.reg!; setReg(b.dataset.reg!); } });
  const seg = root.querySelector<HTMLElement>('#est-seg');
  seg?.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-k]'); if (!b) return;
    st.m = b.dataset.k!; seg.querySelectorAll<HTMLButtonElement>('button[data-k]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    draw(true); salvar();
  });

  const setReg = (v: string) => {
    st.reg = v; rank.n = 0; regWrap.classList.toggle('on', !!v);
    if (v && !inReg(st.sel)) { const d = M().valores; st.sel = codes.filter(inReg).sort((a, b) => (d[b] ?? -1e15) - (d[a] ?? -1e15))[0]; }
    draw(true); if (v) mapa.fitBox(R[v].b); else mapa.fit(); salvar();
    live.textContent = v ? `Mostrando só os ${R[v].count} ${G.nivel.plural} da região de ${R[v].n}.` : `Mostrando os ${nAll} ${G.nivel.plural} ${G.deEstado}.`;
  };
  const pick = (c: string, from: string) => {
    if (!G.mun[c]) return; st.sel = c; st.hov = null;
    if (st.reg && !inReg(st.sel)) { st.reg = ''; regSel.value = ''; regWrap.classList.remove('on'); draw(true); }
    // Escolher uma cidade (no mapa, no ranking, na busca ou na lista do ponto) aproxima o mapa até ela e as vizinhas.
    draw(); mapa.focus(st.sel);
    if (from === 'map' || from === 'pick') busca.inp.value = '';
    // Celular: escolher no ranking sobe até o mapa e a ficha.
    if (from === 'rank' && isMob()) { const y = $('est-mapa').getBoundingClientRect().top + scrollY - 70; window.scrollTo({ top: y, behavior: calm() ? 'auto' : 'smooth' }); }
    salvar(); live.textContent = `${G.mun[st.sel].n} escolhida.`;
  };
  const M = () => ms.find((x) => x.id === st.m)!;
  const nf = (o: Intl.NumberFormatOptions) => new Intl.NumberFormat(G.idioma, o);
  // Posição entre os que têm dado, do maior para o menor.
  const posicao = (c: string, lista: string[]) => { const d = M().valores; if (d[c] == null) return null; return lista.filter((x) => d[x] != null && (d[x] as number) > (d[c] as number)).length + 1; };
  const diferenca = (v: number, ref: number) => {
    const m = M();
    if (m.fmt.formato === 'percentual') { const p = v - ref; const txt = nf({ maximumFractionDigits: 1, minimumFractionDigits: 1, signDisplay: 'exceptZero' }).format(p); return `${txt} ${Math.abs(p) >= 0.95 && Math.abs(p) < 1.05 ? 'ponto' : 'pontos'}`; }
    // Medida que pode ser negativa (saldo de empregos, variação): diferença em unidades da própria medida, com sinal.
    if (m.divergente) return nf({ style: m.fmt.formato === 'moeda' ? 'currency' : 'decimal', currency: m.moeda, notation: m.fmt.compacto ? 'compact' : undefined, maximumFractionDigits: m.fmt.casas, signDisplay: 'exceptZero' }).format(v - ref);
    if (!ref) return '—';
    const r = v / ref - 1;
    if (r >= 1) return `${nf({ maximumFractionDigits: 1 }).format(v / ref)} vezes`;
    return `${nf({ maximumFractionDigits: 0 }).format(Math.abs(r) * 100)}% ${r >= 0 ? 'acima' : 'abaixo'}`;
  };
  const grande = (v: number) => {
    const m = M(); const f = nf({ style: m.fmt.formato === 'moeda' ? 'currency' : m.fmt.formato === 'percentual' ? 'percent' : 'decimal', currency: m.moeda, notation: m.fmt.compacto ? 'compact' : undefined, maximumFractionDigits: m.fmt.casas, minimumFractionDigits: m.fmt.casas, signDisplay: m.fmt.sinal ? 'exceptZero' : 'auto' });
    const partes = f.formatToParts(m.fmt.formato === 'percentual' ? v / 100 : v);
    const ehN = (x: string) => ['minusSign', 'plusSign', 'integer', 'group', 'decimal', 'fraction'].includes(x);
    const i0 = partes.findIndex((p) => ehN(p.type)), i1 = partes.length - 1 - [...partes].reverse().findIndex((p) => ehN(p.type));
    const j = (ps: Intl.NumberFormatPart[]) => ps.map((p) => p.value).join('').trim();
    const antes = j(partes.slice(0, i0)), num = j(partes.slice(i0, i1 + 1)), depois = j(partes.slice(i1 + 1));
    return `${antes ? `<small class="a">${esc(antes)}</small>` : ''}${esc(num)}${depois ? `<small>${esc(depois)}</small>` : ''}`;
  };

  const draw = (full?: boolean) => {
    const m = M(), d = m.valores;
    if (full) {
      const cl = (v: number) => { const i = m.cortes.findIndex((c) => v <= c); return i === -1 ? m.cortes.length : i; };
      mapa.update((c) => (!inReg(c) ? { out: true } : d[c] == null ? { hatch: true } : { f: `var(--est-${cl(d[c] as number) + 1})` }));
      $('est-vt').textContent = st.reg ? `${m.titulo}: os ${R[st.reg].count} ${G.nivel.plural} da região de ${R[st.reg].n}` : m.titulo;
      $('est-vs').textContent = m.subtitulo;
      $('est-carimbo').innerHTML = `<span class="selo">${esc(m.frequencia)}</span><span>${esc(m.carimbo)}</span>`;
      clr.hidden = !st.reg;
      $('est-legenda').innerHTML = `<div class="legend"><div class="ramp">${m.legenda.map((l, i) => `<div><i style="background:var(--est-${i + 1})"></i>${esc(l)}</div>`).join('')}</div><div class="lg-h"><i></i>Sem dado</div><div class="lg-l"><i></i>Divisa de região</div>${st.reg ? '<div class="lg-h lg-z"><i></i>Fora da região</div>' : ''}</div>`;
      $('est-fonte').innerHTML = `<b>Fonte:</b> ${esc(m.carimbo)}.${m.observacao ? ` ${esc(m.observacao)}` : ''} Regiões: ${esc(G.fonteRegioes)}. Malha: ${esc(G.fonteMalha)}.`;
    }
    mapa.mark(st.sel, st.hov);
    const show = st.hov || st.sel, mu = G.mun[show], v = d[show], nd = v == null, reg = R[mu.r].n;
    const pe = posicao(show, codes), pr = st.reg ? posicao(show, codes.filter(inReg)) : null, nEst = codes.filter((c) => d[c] != null).length;
    const pb = m.posBrasil?.[show];
    $('est-ficha').innerHTML = `<div class="card">
      <div class="meta">Região de ${esc(reg)}${show === G.capital ? ' · capital' : ''}${!st.reg && show === st.sel && Object.keys(R).length > 1 ? ` · <button type="button" class="lk" data-reg="${mu.r}">${esc(t.verSoRegiao)}</button>` : ''}</div>
      <div class="row1"><div class="nm">${G.bandeiras?.[show] ? `<img class="est-bandeira-cid" src="${G.bandeiras[show].a}" alt="">` : ''}${esc(mu.n)}</div>${nd ? '<div class="nodata"><span class="sw-h" style="width:22px;height:14px"></span>Sem dado</div>' : `<div class="big">${grande(v as number)}</div>`}</div>
      ${nd ? `<div class="facts"><div class="fact"><span>${esc(m.rotulo)}</span><b>${esc(t.semDadoCidade)}</b></div></div>` : `<div class="facts">
        <div class="fact"><span>${esc(t.posicaoEstado)}</span><b>${pe}º de ${nEst}</b></div>
        ${pr ? `<div class="fact"><span>${esc(t.posicaoRegiao)}</span><b>${pr}º de ${codes.filter((c) => inReg(c) && d[c] != null).length}</b></div>` : ''}
        ${pb ? `<div class="fact"><span>${esc(t.posicaoBrasil)}</span><b>${nf({}).format(pb)}º de ${nf({}).format(m.totalBrasil!)}</b></div>` : ''}
        ${m.ref ? `<div class="fact"><span>${esc(m.ref.rotulo)}</span><b>${esc(m.ref.texto)}</b></div><div class="fact"><span>${esc(t.diferenca)}</span><b>${esc(diferenca(v as number, m.ref.valor))}</b></div>` : ''}</div>`}
      <p class="stamp"><span class="selo">${esc(m.frequencia)}</span><span>${esc(m.carimbo)}</span></p>
      <div class="go"><span>${esc(fill(t.paginaCidade, { nome: mu.n }))}</span><em class="soon">em breve</em></div>${G.bandeiras?.[show] ? `<p class="est-cred-cid">Bandeira: <a href="${esc(G.bandeiras[show].p)}" rel="noopener">${esc(G.bandeiras[show].c)}</a></p>` : ''}</div>`;
    rank.render({ rows: codes.filter(inReg).map((c) => ({ c, v: d[c], txt: m.textos[c] })), sel: st.sel, hov: st.hov, col: m.coluna, ord: st.ord, scope: st.reg ? 'na região' : G.nivel.plural });
  };
  regWrap.classList.toggle('on', !!st.reg);
  if (ms.length > 1) seg?.querySelectorAll<HTMLButtonElement>('button[data-k]').forEach((x) => { const on = x.dataset.k === st.m; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
  draw(true);
  if (st.reg) mapa.fitBox(R[st.reg].b, false);
  else if (Q.get('cidade')) mapa.focus(st.sel, false);
}

/* ---------- início ---------- */
const pk = document.querySelector<HTMLElement>('.pk');
if (pk) trocaDeEstado(pk);
const raiz = document.querySelector<HTMLElement>('[data-estado-mun]');
const json = document.getElementById('dados-estado');
if (raiz && json) paginaMunicipios(raiz, JSON.parse(json.textContent!));
