// Demografia no navegador. Os números chegam prontos do servidor (PaginaDemografia.astro); aqui só se desenha.
// O lugar muda com o evento "statworld:lugar" do mapa (sem escolha fixada, fica o país).
// Partes: população "ao vivo", cada 100 pessoas, pirâmide (e no tempo, com ▶), nascimentos e mortes, halteres, barras de cor ou raça, fluxos.
const el = document.getElementById('dados-demografia');
if (el) {
  const D = JSON.parse(el.textContent!);
  const nf = (o: Intl.NumberFormatOptions = {}) => new Intl.NumberFormat(D.idioma, o);
  const f1 = (v: number) => nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
  const int = (v: number) => nf({ maximumFractionDigits: 0 }).format(Math.round(v));
  const mi = (v: number) => (Math.abs(v) >= 1e6 ? `${f1(v / 1e6)} mi` : Math.abs(v) >= 1e4 ? `${f1(v / 1e3)} mil` : int(v));
  const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? `{${k}}`));
  const $ = (s: string) => document.querySelector<HTMLElement>(s);
  const semDado = '<p class="dm-sem"><span class="sw-h"></span>Sem dado</p>';
  let lugar = 'BR';

  // ---------- ao vivo: estimativa de 1º de julho + crescimento médio entre as duas últimas estimativas, por segundo ----------
  const vivoN = $('[data-vivo-n]'), vivoSr = $('[data-vivo-sr]'), vivoLugar = $('[data-vivo-lugar]');
  const aoVivo = (l: string) => {
    const b = D.aoVivo?.base[l], a = D.aoVivo?.anterior[l]; if (b == null) return null;
    const t0 = Date.UTC(+D.aoVivo.ano, 6, 1), porMs = a != null ? (b - a) / (365.25 * 864e5) : 0;
    return b + porMs * (Date.now() - t0);
  };
  const tique = () => { if (!vivoN) return; const v = aoVivo(lugar); vivoN.textContent = v == null ? 'sem dado' : int(v); if (vivoSr && v != null) vivoSr.textContent = `Cerca de ${f1(v / 1e6)} milhões de pessoas, estimativa`; };
  if (vivoN) { tique(); setInterval(tique, 1000); }

  // ---------- cada 100 ----------
  const CORES = ['var(--dm-c1)', 'var(--dm-c2)', 'var(--dm-c3)', 'var(--dm-c4)', 'var(--dm-c5)'];
  const RACA: [string, string][] = [['Branca', 'branca'], ['Preta', 'preta'], ['Amarela', 'amarela'], ['Parda', 'parda'], ['Indígena', 'indigena']];
  let divisao = $('[data-cem-fixo]')?.dataset.cemFixo ?? 'idade';
  const categorias = (l: string) => {
    if (divisao === 'idade') {
      const p = D.piramides?.[l]; if (!p) return null;
      const t = p.homens.map((h: number, i: number) => h + p.mulheres[i]); const s = (a: number, b: number) => t.slice(a, b).reduce((x: number, y: number) => x + y, 0);
      return [{ n: 'Crianças (0 a 14 anos)', v: s(0, 3) }, { n: 'Jovens e adultos (15 a 59)', v: s(3, 12) }, { n: 'Idosos (60 anos ou mais)', v: s(12, 21) }];
    }
    const c = D.censo?.[l]; if (!c) return null;
    if (divisao === 'raca') return RACA.map(([n, k]) => ({ n, v: c.raca[k] }));
    return [{ n: 'Área urbana', v: c.situacao.urbana }, { n: 'Área rural', v: c.situacao.rural }];
  };
  const cem = (vals: number[]) => { // 100 quadrados: arredonda pelo maior resto, para somar sempre 100
    const t = vals.reduce((s, v) => s + (v || 0), 0), raw = vals.map((v) => ((v || 0) / t) * 100), fl = raw.map(Math.floor);
    const resto = 100 - fl.reduce((s, v) => s + v, 0);
    raw.map((v, i) => [v - fl[i], i]).sort((a, b) => b[0] - a[0]).slice(0, resto).forEach(([, i]) => fl[i]++);
    return { n: fl, p: raw };
  };
  const desenharCem = () => {
    const grade = $('[data-cem-grade]'); if (!grade) return;
    $('[data-titulo-cem]')!.textContent = fill(D.textos.cadaCem, { deLugar: D.de[lugar] });
    const fonte = $('[data-cem-fonte]')!;
    fonte.innerHTML = `<span class="selo">Censo</span> ${esc(divisao === 'idade' ? fonte.dataset.fonteIdade! : fonte.dataset.fonteCenso!)}.`;
    const cats = categorias(lugar);
    if (!cats || cats.some((c) => c.v == null)) { grade.innerHTML = semDado; return; }
    const r = cem(cats.map((c) => c.v)); let q = '';
    cats.forEach((c, i) => { for (let k = 0; k < r.n[i]; k++) q += `<i style="background:${CORES[i]}"></i>`; });
    grade.innerHTML = `<div class="dm-waffle" role="img" aria-label="Cada 100 pessoas: ${cats.map((c, i) => `${c.n} ${r.n[i]}`).join(', ')}">${q}</div>
      <ul class="dm-leg">${cats.map((c, i) => `<li><i style="background:${CORES[i]}"></i><span>${esc(c.n)}</span><b>${r.n[i] === 0 && r.p[i] > 0 ? 'menos de 1' : r.n[i]} <small>· ${f1(r.p[i])}%</small></b></li>`).join('')}</ul>`;
  };
  document.querySelectorAll<HTMLButtonElement>('[data-cem]').forEach((b) => b.addEventListener('click', () => {
    divisao = b.dataset.cem!;
    document.querySelectorAll<HTMLButtonElement>('[data-cem]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    desenharCem();
  }));

  // ---------- pirâmide ----------
  const pirEl = $('[data-piramide]');
  // a = {h:[17], m:[17]} (17 faixas, a última 80+). c = mesma forma, para o contorno de comparação.
  const svgPiramide = (AG: string[], a: { h: number[]; m: number[] }, c: { h: number[]; m: number[] } | null, proj: boolean, max: number, rotulo: string) => {
    const parte = (p: any) => { const t = [...p.h, ...p.m].reduce((s: number, v: number) => s + v, 0); return [p.h.map((v: number) => (v / t) * 100), p.m.map((v: number) => (v / t) * 100)]; };
    const A = parte(a), Cc = c ? parte(c) : null;
    const n = AG.length, W = 640, H = 500, mid = W / 2, gap = 52, T = 30, B = 28, lado = mid - gap / 2 - 8;
    const bh = (H - T - B) / n, y = (i: number) => T + (n - 1 - i) * bh, w = (v: number) => (Math.min(v, max) / max) * lado;
    let g = `<text class="sx" x="${mid - gap / 2 - lado}" y="16">${esc(D.textos.homens)}</text><text class="sx" x="${mid + gap / 2 + lado}" y="16" text-anchor="end">${esc(D.textos.mulheres)}</text>`;
    [0, max / 2, max].forEach((t) => [mid - gap / 2 - w(t), mid + gap / 2 + w(t)].forEach((x) => { g += `<line class="gl" x1="${x}" x2="${x}" y1="${T - 4}" y2="${H - B}"/><text x="${x}" y="${H - 8}" text-anchor="middle">${nf({ maximumFractionDigits: 1 }).format(t)}%</text>`; }));
    for (let i = 0; i < n; i++) {
      const Y = y(i) + 1, h = bh - 2;
      g += `<rect class="m" x="${mid - gap / 2 - w(A[0][i])}" y="${Y}" width="${w(A[0][i])}" height="${h}"><title>${AG[i]} anos, homens: ${f1(A[0][i])}%</title></rect>`;
      g += `<rect class="f" x="${mid + gap / 2}" y="${Y}" width="${w(A[1][i])}" height="${h}"><title>${AG[i]} anos, mulheres: ${f1(A[1][i])}%</title></rect>`;
      g += `<text class="age" x="${mid}" y="${Y + h / 2 + 4}" text-anchor="middle">${AG[i]}</text>`;
    }
    if (Cc) {
      const degrau = (s: number, sinal: number) => { let d = ''; for (let i = 0; i < n; i++) { const x = sinal < 0 ? mid - gap / 2 - w(Cc[s][i]) : mid + gap / 2 + w(Cc[s][i]); d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(y(i) + bh).toFixed(1)}L${x.toFixed(1)} ${y(i).toFixed(1)}`; } return d; };
      g += `<path class="cmp" d="${degrau(0, -1)}"/><path class="cmp" d="${degrau(1, 1)}"/>`;
    }
    const tabela = `<table class="sr"><caption>${esc(rotulo)}, % da população</caption><tr><th>Idade</th><th>Homens</th><th>Mulheres</th></tr>${AG.map((l, i) => `<tr><td>${l}</td><td>${f1(A[0][i])}%</td><td>${f1(A[1][i])}%</td></tr>`).join('')}</table>`;
    return `<svg class="dm-piramide${proj ? ' proj' : ''}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>${c ? `<p class="dm-leg-cmp"><i></i>${esc(D.textos.linhaBrasil)}</p>` : ''}${tabela}`;
  };
  const junta = (a: number[]) => [...a.slice(0, 16), a.slice(16).reduce((s, v) => s + v, 0)];
  const AG17 = (g: string[]) => [...g.slice(0, 16), '80+'];
  // Pirâmide de 2022 (Visão geral)
  const desenharPiramide = () => {
    if (!pirEl || !D.piramides) return;
    $('[data-titulo-pir]')!.textContent = fill(D.textos.piramideTitulo, { deLugar: D.de[lugar] });
    const p = D.piramides[lugar]; if (!p) { pirEl.innerHTML = semDado; return; }
    const br = lugar !== 'BR' ? D.piramides.BR : null;
    pirEl.innerHTML = svgPiramide(AG17(D.grupos), { h: junta(p.homens), m: junta(p.mulheres) }, br ? { h: junta(br.homens), m: junta(br.mulheres) } : null, false, 6, `Pirâmide etária ${D.de[lugar]}`);
  };
  // Pirâmide no tempo (aba Pirâmide etária), com ▶
  const anoEl = $('[data-ano]') as HTMLInputElement | null;
  let tocando: any = null;
  const desenharTempo = () => {
    if (!pirEl || !D.tempo || !anoEl) return;
    const ano = D.tempo.anos[+anoEl.value], proj = D.tempo.tipo[ano] === 'projecao';
    $('[data-titulo-pir]')!.textContent = `${fill(D.textos.piramideTitulo, { deLugar: D.de[lugar] })} em ${ano}`;
    $('[data-ano-txt]')!.textContent = String(ano);
    $('[data-ano-selo]')!.textContent = proj ? 'Projeção' : 'Censo';
    const p = D.tempo.valores[lugar]?.[ano];
    if (!p || p.h.some((v: number | null) => v == null)) { pirEl.innerHTML = semDado; return; }
    const br = lugar !== 'BR' ? D.tempo.valores.BR?.[ano] : null;
    pirEl.innerHTML = svgPiramide(D.tempo.grupos, p, br, proj, 7, `Pirâmide etária ${D.de[lugar]} em ${ano}`);
  };
  anoEl?.addEventListener('input', () => { desenharTempo(); });
  $('[data-play]')?.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    if (tocando) { clearInterval(tocando); tocando = null; b.textContent = '▶'; return; }
    if (+anoEl!.value >= +anoEl!.max) anoEl!.value = '0';
    b.textContent = '❚❚';
    tocando = setInterval(() => { if (+anoEl!.value >= +anoEl!.max) { clearInterval(tocando); tocando = null; b.textContent = '▶'; return; } anoEl!.value = String(+anoEl!.value + 1); desenharTempo(); }, 900);
    desenharTempo();
  });

  // ---------- nascimentos e mortes no tempo ----------
  const desenharVital = () => {
    const box = $('[data-vital]'); if (!box || !D.vital) return;
    $('[data-titulo-vital]')!.textContent = fill(D.textos.vitalTitulo, { deLugar: D.de[lugar] });
    const V = D.vital, rcN = V.nascimentos[lugar] ?? {}, rcO = V.obitos[lugar] ?? {}, pj = V.projecao[lugar] ?? {};
    const anosRC = V.anos.filter((a: string) => rcN[a] != null), ultimo = +anosRC.at(-1);
    const anosPj = Object.keys(pj).map(Number).filter((a) => a >= ultimo && a <= 2070);
    const serie = (pts: [number, number][]) => pts.filter(([, v]) => v != null);
    const sN = serie(anosRC.map((a: string) => [+a, rcN[a]])), sO = serie(anosRC.map((a: string) => [+a, rcO[a]]));
    const pN = serie(anosPj.map((a) => [a, pj[a].n])), pO = serie(anosPj.map((a) => [a, pj[a].o]));
    const todos = [...sN, ...sO, ...pN, ...pO]; if (!todos.length) { box.innerHTML = semDado; return; }
    const W = 900, H = 340, L = 10, R = 120, T = 16, B = 30, x0 = Math.min(...todos.map((p) => p[0])), x1 = Math.max(...todos.map((p) => p[0]));
    let hi = Math.max(...todos.map((p) => p[1])); const p10 = Math.pow(10, Math.floor(Math.log10(hi))), stp = [1, 2, 2.5, 5, 10].map((f) => (f * p10) / 2).find((s) => hi / s <= 5) || p10; hi = Math.ceil(hi / stp) * stp;
    const X = (v: number) => L + ((v - x0) / (x1 - x0)) * (W - L - R), Y = (v: number) => T + ((hi - v) / hi) * (H - T - B);
    let g = ''; for (let v = 0; v <= hi + 1e-9; v += stp) g += `<line class="${v === 0 ? 'ax' : 'gl'}" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L}" y="${Y(v) - 5}">${mi(v)}</text>`;
    [x0, ultimo, 2040, 2070].filter((a, i, s) => a >= x0 && a <= x1 && s.indexOf(a) === i).forEach((a) => (g += `<text x="${X(a)}" y="${H - 8}" text-anchor="middle">${a}</text>`));
    const linha = (pts: [number, number][], cls: string) => (pts.length ? `<path class="${cls}" d="M${pts.map((p) => `${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('L')}"/>` : '');
    g += linha(sN, 'ln n') + linha(sO, 'ln o') + linha(pN, 'ln n pj') + linha(pO, 'ln o pj');
    const fim = (pts: [number, number][], nome: string, cls: string) => { const l = pts.at(-1); return l ? `<text class="lb ${cls}" x="${X(l[0]) + 8}" y="${Y(l[1]) + 4}">${nome}</text>` : ''; };
    g += fim(pN.length ? pN : sN, 'Nascimentos', 'n') + fim(pO.length ? pO : sO, 'Mortes', 'o');
    const cruz = anosPj.find((a) => pj[a].o > pj[a].n);
    if (cruz) g += `<line class="cz" x1="${X(cruz)}" x2="${X(cruz)}" y1="${T}" y2="${H - B}"/><text class="czt" x="${X(cruz) + 6}" y="${T + 12}">${cruz}: mortes passam os nascimentos</text>`;
    const fpm = pj[String(ultimo)]?.f ?? pj[ultimo]?.f;
    const tabela = `<table class="sr"><caption>Nascimentos e mortes ${esc(D.de[lugar])}</caption><tr><th>Ano</th><th>Nascimentos</th><th>Mortes</th></tr>${sN.map(([a, v], i) => `<tr><td>${a}</td><td>${int(v)}</td><td>${sO[i] ? int(sO[i][1]) : ''}</td></tr>`).join('')}</table>`;
    box.innerHTML = `<svg class="dm-linhas" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>
      <div class="dm-fatos"><div><span>Nascimentos em ${ultimo}</span><b>${rcN[ultimo] != null ? int(rcN[ultimo]) : 'sem dado'}</b></div><div><span>Mortes em ${ultimo}</span><b>${rcO[ultimo] != null ? int(rcO[ultimo]) : 'sem dado'}</b></div>
      <div><span>Filhos por mulher (projeção, ${ultimo})</span><b>${fpm != null ? nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(fpm) : 'sem dado'}</b></div><div><span>Mortes passam os nascimentos (projeção)</span><b>${cruz ?? 'não até 2070'}</b></div></div>${tabela}`;
  };

  // ---------- halteres: esperança de vida de homens e mulheres por estado ----------
  const halSel = $('[data-hal-ano]') as HTMLSelectElement | null;
  const desenharHalteres = () => {
    const box = $('[data-halteres]'); if (!box || !D.halteres || !halSel) return;
    const ano = halSel.value, V = D.halteres.valores;
    const ls = D.lugares.filter((l: string) => l !== 'BR' && V[l]?.[ano]).sort((a: string, b: string) => (V[b][ano][0] + V[b][ano][1]) - (V[a][ano][0] + V[a][ano][1]));
    const todos = ls.flatMap((l: string) => V[l][ano]).concat(V.BR?.[ano] ?? []);
    const lo = Math.floor(Math.min(...todos) - 1), hi = Math.ceil(Math.max(...todos) + 1);
    const W = 900, L = 170, R = 60, rh = 26, T = 28, H = T + ls.length * rh + 20, X = (v: number) => L + ((v - lo) / (hi - lo)) * (W - L - R);
    let g = `<text class="sx" x="${L}" y="16"><tspan class="hm">● Homens</tspan>   <tspan class="ml">● Mulheres</tspan></text>`;
    for (let v = lo; v <= hi; v += 2) g += `<line class="gl" x1="${X(v)}" x2="${X(v)}" y1="${T - 6}" y2="${H - 18}"/><text x="${X(v)}" y="${H - 4}" text-anchor="middle">${v}</text>`;
    if (V.BR?.[ano]) { const m = (V.BR[ano][0] + V.BR[ano][1]) / 2; g += `<line class="br" x1="${X(m)}" x2="${X(m)}" y1="${T - 6}" y2="${H - 18}"/><text class="brt" x="${X(m) + 4}" y="${T - 10}">Brasil</text>`; }
    ls.forEach((l: string, i: number) => {
      const [h, m] = V[l][ano], y = T + i * rh + rh / 2, on = l === lugar;
      g += `<text class="uf${on ? ' on' : ''}" x="${L - 12}" y="${y + 4}" text-anchor="end">${esc(D.nomes[l])}</text><line class="hb" x1="${X(h)}" x2="${X(m)}" y1="${y}" y2="${y}"/><circle class="hm" cx="${X(h)}" cy="${y}" r="5"><title>${esc(D.nomes[l])}, homens: ${f1(h)} anos</title></circle><circle class="ml" cx="${X(m)}" cy="${y}" r="5"><title>${esc(D.nomes[l])}, mulheres: ${f1(m)} anos</title></circle>`;
    });
    const tabela = `<table class="sr"><caption>Esperança de vida ao nascer em ${ano}, projeção</caption><tr><th>Estado</th><th>Homens</th><th>Mulheres</th></tr>${ls.map((l: string) => `<tr><td>${esc(D.nomes[l])}</td><td>${f1(V[l][ano][0])}</td><td>${f1(V[l][ano][1])}</td></tr>`).join('')}</table>`;
    box.innerHTML = `<svg class="dm-halteres" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>${tabela}`;
  };
  halSel?.addEventListener('change', desenharHalteres);

  // ---------- barras 100%: cor ou raça nos estados ----------
  let ordenar = 'parda';
  const desenharBarras = () => {
    const box = $('[data-barras-raca]'); if (!box || !D.censo) return;
    const pct = (l: string, k: string) => { const r = D.censo[l]?.raca; return r?.total ? (r[k] / r.total) * 100 : null; };
    const ls = D.lugares.filter((l: string) => D.censo[l]).sort((a: string, b: string) => (a === 'BR' ? -1 : b === 'BR' ? 1 : (pct(b, ordenar) ?? 0) - (pct(a, ordenar) ?? 0)));
    box.innerHTML = `<div class="dm-b100-leg">${RACA.map(([n, k], i) => `<button type="button" data-ordenar="${k}" class="${k === ordenar ? 'on' : ''}" aria-pressed="${k === ordenar}"><i style="background:${CORES[i]}"></i>${n}</button>`).join('')}</div>
      <ul class="dm-b100">${ls.map((l: string) => `<li class="${l === lugar ? 'on' : ''}${l === 'BR' ? ' br' : ''}"><span>${esc(D.nomes[l])}</span><div class="b">${RACA.map(([n, k], i) => { const p = pct(l, k) ?? 0; return `<i style="width:${p}%;background:${CORES[i]}" title="${n}: ${f1(p)}%"></i>`; }).join('')}</div><b>${f1(pct(l, ordenar) ?? 0)}%</b></li>`).join('')}</ul>`;
    box.querySelectorAll<HTMLButtonElement>('[data-ordenar]').forEach((b) => b.addEventListener('click', () => { ordenar = b.dataset.ordenar!; desenharBarras(); }));
  };

  // ---------- fluxos de migração ----------
  const desenharFluxos = () => {
    const box = $('[data-fluxos]'); if (!box || !D.fluxos) return;
    const fs = lugar === 'BR' ? D.fluxos.slice(0, 10) : D.fluxos.filter((f: any) => f.de === lugar || f.para === lugar).slice(0, 10);
    if (!fs.length) { box.innerHTML = `<p class="dm-sub">Nenhum dos maiores caminhos entre estados passa ${lugar === 'BR' ? 'aqui' : `por ${esc(D.nomes[lugar])}`}.</p>`; return; }
    const max = Math.max(...fs.map((f: any) => f.pessoas));
    box.innerHTML = `<ol class="dm-fluxos">${fs.map((f: any) => `<li><span class="r">${esc(D.nomes[f.de])} <span aria-hidden="true">→</span><span class="sr"> para </span> ${esc(D.nomes[f.para])}</span><span class="b"><i style="width:${(f.pessoas / max) * 100}%"></i></span><b>${mi(f.pessoas)}</b></li>`).join('')}</ol>`;
  };

  const trocar = (l: string) => {
    lugar = D.lugares.includes(l) ? l : 'BR';
    if (vivoLugar) vivoLugar.textContent = D.nomes[lugar];
    tique(); desenharCem(); desenharPiramide(); desenharTempo(); desenharVital(); desenharHalteres(); desenharBarras(); desenharFluxos();
  };
  document.addEventListener('statworld:lugar', (e) => { const d = (e as CustomEvent).detail; trocar(d.fixado ?? 'BR'); });
  trocar('BR');
}
