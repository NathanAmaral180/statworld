// Molde de telas de Economia, independente de país. Conteúdo e rótulos vêm de window.SW_X.
(function(){
const SW2 = window.SW2 = {};
const X = () => window.SW_X;
const num = (n,d=1) => window.SW.num(n,d);

const FQ = {diario:'Diário',mensal:'Mensal',trimestral:'Trimestral',anual:'Anual',reuniao:'Por reunião',semanal:'Semanal',aovivo:'Ao vivo'};
SW2.ex = () => `<span class="ex" title="Número de exemplo, não é dado oficial">Exemplo</span>`;
SW2.freq = f => `<span class="freq${f==='aovivo'?' live':''}" title="Frequência de atualização">${FQ[f]}</span>`;
SW2.stamp = (src,f,ex=true) => `<div class="stamp">${ex?SW2.ex():''}${SW2.freq(f)}<span>${src}</span></div>`;
SW2.note = html => `<p class="mnote"><em class="i">i</em><span>${html}</span></p>`;

/* ---------- barra de abas agrupada ---------- */
const themeQ = () => { const t=new URLSearchParams(location.search||location.hash.slice(1)).get('theme'); return t?`?theme=${t}`:''; };
SW2.href = k => { const h=X().pages[k]; return h? encodeURI(h)+themeQ() : null; };
// Navegação em dois níveis. Nível 1: grupos. Nível 2: abas do grupo ativo.
// Nunca quebra linha. No desktop o que não couber vai para “Mais”; no celular (≤640px de largura) o nível 2 rola.
SW2.TABS = [
 {k:'geral', g:'Visão geral', s:'Visão geral', items:[['geral','Visão geral']]},
 {k:'set', g:'Setores', s:'Setores', items:[['agro','Agro'],['ind','Indústria'],['serv','Serviços']]},
 {k:'pes', g:'Pessoas e governo', s:'Pessoas', items:[['trab','Trabalho e renda'],['precos','Preços e poder de compra'],['imp','Impostos']]},
 {k:'mun', g:'Mundo e mercado', s:'Mundo', items:[['com','Comércio exterior'],['din','Dinheiro e juros'],['contas','Contas públicas']]}
];
const soon = n => `${n}<em class="soon">em breve</em>`;
const item = (k,n,active) => { const h=SW2.href(k);
  return k===active?`<span class="nv-i on" aria-current="page">${n}</span>`: h?`<a class="nv-i" href="${h}">${n}</a>`:`<span class="nv-i off" aria-disabled="true">${soon(n)}</span>`; };
const more = () => `<div class="nv-more" hidden><button type="button" class="nv-mb" aria-haspopup="true" aria-expanded="false">Mais<span class="nv-n"></span><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button><div class="nv-menu" role="menu"></div></div>`;
SW2.nav = (active,tabs=SW2.TABS) => {
  const G=tabs.find(g=>g.items.some(i=>i[0]===active))||tabs[0];
  const l1=tabs.map(g=>{ const first=g.items.find(([k])=>SW2.href(k)), lab=`<span class="lf">${g.g}</span><span class="ls">${g.s||g.g}</span>`;
    if(g===G) return `<span class="nv-i on" aria-current="${g.items.length===1?'page':'true'}">${lab}</span>`;
    return first?`<a class="nv-i" href="${SW2.href(first[0])}">${lab}</a>`:`<span class="nv-i off" aria-disabled="true">${lab}<em class="soon">em breve</em></span>`; }).join('');
  const l2=G.items.length>1?`<div class="nv2" aria-label="${G.g}"><div class="nv-row">${G.items.map(([k,n])=>item(k,n,active)).join('')}</div>${more()}</div>`:'';
  return `<nav class="nv" aria-label="Seções de Economia"><div class="nv1"><div class="nv-row">${l1}</div>${more()}</div>${l2}</nav>`;
};
const fit = (lvl,mobile) => {
  const row=lvl.querySelector('.nv-row'), m=lvl.querySelector('.nv-more'), menu=m.querySelector('.nv-menu'), btn=m.querySelector('.nv-mb');
  [...menu.children].forEach(c=>row.appendChild(c)); m.hidden=true; lvl.classList.remove('has-more');
  const items=[...row.children]; items.sort((a,b)=>(+a.dataset.o)-(+b.dataset.o)).forEach(c=>row.appendChild(c));
  if(mobile && lvl.classList.contains('nv2')){ const on=row.querySelector('.on'); if(on){ const d=on.getBoundingClientRect().left-row.getBoundingClientRect().left+row.scrollLeft; row.scrollLeft=Math.max(0,d-20); } return; }
  if(row.scrollWidth<=row.clientWidth+1) return;
  m.hidden=false; lvl.classList.add('has-more');
  for(let i=items.length-1;i>=0 && row.scrollWidth>row.clientWidth+1;i--){ if(items[i].classList.contains('on')) continue; menu.prepend(items[i]); }
  btn.querySelector('.nv-n').textContent=` (${menu.children.length})`;
};
SW2.mountNav = (el,active,tabs) => {
  el.innerHTML=SW2.nav(active,tabs); const nav=el.querySelector('.nv');
  nav.querySelectorAll('.nv-row').forEach(r=>[...r.children].forEach((c,i)=>c.dataset.o=i));
  const run=()=>{ try{ if(!nav.isConnected) return; const mob=(nav.parentElement||nav).clientWidth<=640; nav.classList.toggle('m',mob); nav.querySelectorAll('.nv1,.nv2').forEach(l=>fit(l,mob)); }catch(e){ console.error('SW2.mountNav',e); } };
  let last=''; const ro=new ResizeObserver(()=>{ const k=(nav.parentElement||nav).clientWidth+'x'+nav.offsetHeight; if(k!==last){ last=k; run(); } }); ro.observe(nav.parentElement||nav); ro.observe(nav);
  nav.addEventListener('click',e=>{ const b=e.target.closest('.nv-mb'); const all=nav.querySelectorAll('.nv-more');
    all.forEach(x=>{ if(!b||!x.contains(b)){ x.classList.remove('open'); x.querySelector('.nv-mb').setAttribute('aria-expanded','false'); } });
    if(b){ const x=b.parentNode, o=!x.classList.contains('open'); x.classList.toggle('open',o); b.setAttribute('aria-expanded',o); } });
  document.addEventListener('click',e=>{ if(!nav.contains(e.target)) nav.querySelectorAll('.nv-more.open').forEach(x=>{x.classList.remove('open');x.querySelector('.nv-mb').setAttribute('aria-expanded','false')}); });
  nav.addEventListener('keydown',e=>{ if(e.key==='Escape') nav.querySelectorAll('.nv-more.open').forEach(x=>x.classList.remove('open')); });
  run(); setTimeout(run,0); setTimeout(run,300); setTimeout(run,1200);
  if(document.readyState==='complete') run(); else window.addEventListener('load',run,{once:true});
  if(document.fonts) document.fonts.ready.then(run);
  document.querySelectorAll('link[rel=stylesheet]').forEach(l=>{ if(!l.sheet) l.addEventListener('load',run,{once:true}); });
  nav._refit=run; return nav;
};
SW2.tabbar = SW2.nav; SW2.mountTabbar = SW2.mountNav;

/* ---------- cabeçalho de página ---------- */
SW2.today = (items,label,note) => `<section class="today" aria-label="${label}">
 <div class="today-h">${label}<span>${note}</span></div>
 ${items.map(k=>`<div class="kpi"><div class="kpi-top"><b>${k.v}</b></div><div class="lbl">${k.l}</div>${SW2.stamp(k.src,k.f,k.ex!==false)}</div>`).join('')}
</section>`;
// root: elemento com #hdr, #crumb, #today, #tabs
SW2.page = (root,o) => {
  const C=X().country, q=s=>root.querySelector(s);
  q('#hdr').innerHTML = window.SW.header('Economia').replace(/Economia do Brasil\.html/g, SW2.href('geral'));
  q('#themeBtn').onclick = window.SW.toggleTheme; window.SW.syncThemeBtn();
  q('#crumb').innerHTML = `<a href="#">Economia</a><span>/</span>${o.active==='geral'?`<span>${C.name}</span>`:`<a href="${SW2.href('geral')}">${C.name}</a><span>/</span><span>${o.label}</span>`}`;
  q('#title').textContent = C.title;
  if(o.today) q('#today').innerHTML = o.todayRaw ? window.SW.today(o.today,o.todayLabel||`${C.name} hoje`,'Números mais recentes, nacionais') : SW2.today(o.today,o.todayLabel,o.todayNote||'Números mais recentes, nacionais');
  SW2.mountTabbar(q('#tabs'),o.active);
  document.title = `${o.label||'Visão geral'} · ${C.title} · StatWorld`;
};
SW2.seg = (el,opts,cur,on) => { const paint=c=>el.innerHTML=opts.map(([k,n])=>`<button role="tab" data-k="${k}" class="${k===c?'on':''}" aria-selected="${k===c}">${n}</button>`).join('');
  paint(cur); el.onclick=e=>{const b=e.target.closest('button'); if(b){paint(b.dataset.k); on(b.dataset.k)}}; };

/* ---------- ranking genérico (mesmo visual do 1c) ---------- */
SW2.Ranking = class {
  constructor(el,o){ this.el=el; this.o=o; this.expanded=false;
    el.addEventListener('mouseover',e=>{const li=e.target.closest('li[data-uf]'); if(li) o.onHover(li.dataset.uf);});
    el.addEventListener('mouseleave',()=>o.onHover(null));
    el.addEventListener('click',e=>{ if(e.target.closest('.more')){ this.expanded=!this.expanded; this.render(this.last); return;} const li=e.target.closest('li[data-uf]'); if(li) o.onClick(li.dataset.uf);});
    el.addEventListener('keydown',e=>{ if(!['ArrowDown','ArrowUp'].includes(e.key)) return; e.preventDefault();
      const ord=this.sorted.map(r=>r.uf); let i=ord.indexOf(this.last.sel); i=Math.max(0,Math.min(ord.length-1,i+(e.key==='ArrowDown'?1:-1)));
      o.onClick(ord[i]); requestAnimationFrame(()=>{const li=this.el.querySelector(`li[data-uf="${ord[i]}"]`); li&&li.focus();}); });
  }
  render(st){ // {rows:[{uf,v,txt}], sel, hov, col}
    this.last=st; const C=X().country, n=st.nTop||8, nm=this.o.name||(u=>window.SW_DATA.UNITS[u][0]);
    const val=st.rows.filter(r=>r.v!=null).sort((a,b)=>b.v-a.v);
    const nul=st.rows.filter(r=>r.v==null).sort((a,b)=>nm(a.uf).localeCompare(nm(b.uf)));
    this.sorted=[...val,...nul];
    const max=Math.max(...val.map(r=>Math.abs(r.v)),1e-9);
    const row=(r,i)=>{ const nd=r.v==null;
      return `<li data-uf="${r.uf}" tabindex="${r.uf===st.sel?0:-1}" class="${r.uf===st.sel?'on':''} ${r.uf===st.hov?'hv':''}" aria-selected="${r.uf===st.sel}" role="option">
      <span class="n">${nd?'—':i+1}</span><span class="nm">${nm(r.uf)}</span>
      <span class="bar ${nd?'h':''}">${nd?'':`<i style="width:${Math.max(2,Math.abs(r.v)/max*100)}%"></i>`}</span>
      <span class="v ${nd?'nd':''}">${nd?'sem dado':r.txt}</span></li>`; };
    let list;
    if(this.expanded) list=this.sorted.map(row).join('');
    else { list=val.slice(0,n).map(row).join(''); const si=this.sorted.findIndex(r=>r.uf===st.sel);
      if(si>=n){ list+=`<li class="gap" aria-hidden="true">···</li>`+row(this.sorted[si],si); } }
    this.el.innerHTML = `<div class="rk-h"><span>${st.head||C.Unit}</span><span>${st.col}</span></div>
      <ul class="rk" role="listbox" aria-label="Ranking">${list}</ul>
      <div class="rk-more"><button class="more" type="button" aria-expanded="${this.expanded}">${this.expanded?`Mostrar só os ${n} primeiros`:`Ver todos os ${st.rows.length} ${st.plural||C.units}`}</button><span>${nul.length?`${nul.length} sem dado`:''}</span></div>`;
  }
};
SW2.rankOf = (data,u) => { const vals=Object.entries(data).filter(([,x])=>x!=null).sort((a,b)=>b[1]-a[1]); const i=vals.findIndex(([k])=>k===u); return {rank:i<0?null:i+1,of:vals.length}; };

/* ---------- escala ---------- */
const nice = r => { const p=Math.pow(10,Math.floor(Math.log10(r))), f=r/p; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p; };
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
SW2.mes = d => `${MES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
SW2.mesLongo = d => `${MES[d.getMonth()]} ${d.getFullYear()}`;
SW2.dia = d => `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`;

/* ---------- linha ---------- */
// o: {pts:[[Date|label,v]], W,H, fmtY, tip:(p,i)=>[l1,l2], xl:(p,i,n)=>txt, band:[[lo,hi]], ref:{v,label}, lo, hi, onHover, ttl}
SW2.line = (el,o) => {
  const pts=o.pts, n=pts.length, W=o.W||900, H=o.H||360, L=8, R=64, T=o.ttl?34:16, B=30;
  let lo=o.lo!=null?o.lo:Math.min(...pts.map(p=>p[1])), hi=o.hi!=null?o.hi:Math.max(...pts.map(p=>p[1]));
  if(o.band) o.band.forEach(b=>{lo=Math.min(lo,b[0]);hi=Math.max(hi,b[1])});
  const step=o.step||nice((hi-lo)/4||1); lo=Math.floor(lo/step)*step; hi=Math.ceil(hi/step)*step; if(hi===lo) hi=lo+step;
  const x=i=>L+i/(n-1)*(W-L-R), y=v=>T+(hi-v)/(hi-lo)*(H-T-B), fy=o.fmtY||(v=>num(v,0));
  let g=o.ttl?`<text class="ttl" x="${L}" y="16">${o.ttl}</text>`:'';
  for(let v=lo; v<=hi+step/1e6; v+=step) g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${W-R+8}" y="${y(v)+4}">${fy(v)}</text>`;
  const xt=o.xt||[0,.25,.5,.75,1].map(f=>Math.round(f*(n-1)));
  xt.forEach((i,k)=>g+=`<text x="${x(i)}" y="${H-8}" text-anchor="${k===0?'start':k===xt.length-1?'end':'middle'}">${(o.xl||((p)=>p[0] instanceof Date?SW2.mes(p[0]):p[0]))(pts[i],i,n)}</text>`);
  let band='';
  if(o.band){ band=`<path class="band" d="M${o.band.map((b,i)=>x(i).toFixed(1)+' '+y(b[1]).toFixed(1)).join('L')}L${o.band.map((b,i)=>x(i).toFixed(1)+' '+y(b[0]).toFixed(1)).reverse().join('L')}Z"/>`; }
  const ref=o.ref?`<line class="ref" x1="${L}" x2="${W-R}" y1="${y(o.ref.v)}" y2="${y(o.ref.v)}"/><text class="reft" x="${L+4}" y="${y(o.ref.v)-6}">${o.ref.label}</text>`:'';
  const d='M'+pts.map((p,i)=>x(i).toFixed(1)+' '+y(p[1]).toFixed(1)).join('L'), li=n-1;
  el.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria||'Série'}">${g}${band}${ref}<path class="ln" d="${d}"/><circle cx="${x(li)}" cy="${y(pts[li][1])}" r="4" style="fill:var(--accent)"/>
    <g class="hv" style="display:none"><line class="xh" y1="${T}" y2="${H-B}"/><circle r="4" style="fill:var(--bg);stroke:var(--accent);stroke-width:2"/><g class="tip"><rect rx="4" width="168" height="44"/><text class="t1" x="10" y="18"></text><text class="t2" x="10" y="36" style="font-weight:600"></text></g></g>
    <rect width="${W}" height="${H}" fill="transparent" class="hit"/></svg>`;
  const svg=el.querySelector('svg'), hv=svg.querySelector('.hv'), tipf=o.tip||((p)=>[p[0] instanceof Date?SW2.mesLongo(p[0]):p[0], fy(p[1])]);
  const show=i=>{ if(i==null){hv.style.display='none';return} const X0=x(i),Y0=y(pts[i][1]); hv.style.display='';
    const l=hv.querySelector('line'); l.setAttribute('x1',X0); l.setAttribute('x2',X0); const c=hv.querySelector('circle'); c.setAttribute('cx',X0); c.setAttribute('cy',Y0);
    const tip=hv.querySelector('.tip'), [a,b]=tipf(pts[i],i); tip.setAttribute('transform',`translate(${X0>W-240?X0-180:X0+12},${Math.max(T,Math.min(H-B-44,Y0-56))})`); tip.querySelector('.t1').textContent=a; tip.querySelector('.t2').textContent=b; };
  const hit=svg.querySelector('.hit');
  hit.onmousemove=e=>{const r=svg.getBoundingClientRect(); const px=(e.clientX-r.left)/r.width*W; const i=Math.max(0,Math.min(li,Math.round((px-L)/(W-L-R)*li))); show(i); o.onHover&&o.onHover(i);};
  hit.onmouseleave=()=>{show(null); o.onHover&&o.onHover(null);};
  return {show};
};

/* ---------- colunas ---------- */
// o: {pts:[[label,v]], W,H, fmt, ref:{v,label}, every}
SW2.cols = (el,o) => {
  const pts=o.pts, n=pts.length, W=o.W||900, H=o.H||380, L=8, R=56, T=28, B=30, max=Math.max(...pts.map(p=>p[1]));
  const step=o.step||nice(max/4), hi=Math.ceil(max/step)*step, bw=(W-L-R)/n, y=v=>T+(hi-v)/hi*(H-T-B), f=o.fmt||(v=>num(v,1));
  let g=''; for(let v=0; v<=hi+1e-9; v+=step) g+=`<line class="${v===0?'ax':'gl'}" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${W-R+8}" y="${y(v)+4}">${f(v)}</text>`;
  const every=o.every||Math.ceil(n/7);
  const bars=pts.map((p,i)=>{const X0=L+i*bw+bw*.14, w=bw*.72, last=i===n-1;
    return `<rect class="col${last?' hl':''}" data-i="${i}" x="${X0}" y="${y(p[1])}" width="${w}" height="${y(0)-y(p[1])}"/>${(i%every===0&&n-1-i>=every/2)||last?`<text x="${X0+w/2}" y="${H-8}" text-anchor="middle">${p[0]}</text>`:''}${i===0||last?`<text class="vl" x="${X0+w/2}" y="${y(p[1])-8}" text-anchor="middle">${f(p[1])}</text>`:''}`}).join('');
  const ref=o.ref?`<line class="ref" x1="${L}" x2="${W-R}" y1="${y(o.ref.v)}" y2="${y(o.ref.v)}"/><text class="reft" x="${L+4}" y="${y(o.ref.v)-6}">${o.ref.label}</text>`:'';
  el.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria||'Série anual'}">${g}${bars}${ref}<g class="tip" style="display:none;pointer-events:none"><rect rx="4" width="150" height="44"/><text class="t1" x="10" y="18"></text><text class="t2" x="10" y="36" style="font-weight:600"></text></g></svg>`;
  const svg=el.querySelector('svg'), tip=svg.querySelector('.tip');
  svg.onmousemove=e=>{const r=e.target.closest('rect.col'); svg.querySelectorAll('rect.col').forEach(b=>b.classList.toggle('hl',b===r||(!r&&+b.dataset.i===n-1)));
    if(!r){tip.style.display='none';return} const i=+r.dataset.i, X0=L+i*bw; tip.style.display=''; tip.setAttribute('transform',`translate(${X0>W-220?X0-152:X0+bw},${Math.max(T,y(pts[i][1])-30)})`);
    tip.querySelector('.t1').textContent=pts[i][0]; tip.querySelector('.t2').textContent=(o.tipf||f)(pts[i][1]); };
  svg.onmouseleave=()=>{tip.style.display='none'; svg.querySelectorAll('rect.col').forEach(b=>b.classList.toggle('hl',+b.dataset.i===n-1));};
};

/* ---------- lista de barras grande ---------- */
// rows:[{name,v,txt,share}] ; cols:[nome, barra, valor, participação]
SW2.barlist = (el,o) => { const max=Math.max(...o.rows.filter(r=>r.v!=null).map(r=>r.v));
  el.innerHTML=`<div class="bl-h"><span></span><span>${o.cols[0]}</span><span></span><span style="text-align:right">${o.cols[1]}</span><span style="text-align:right">${o.cols[2]||''}</span></div>
  <ol class="bl">${o.rows.map((r,i)=>`<li><span class="n">${i+1}</span><span>${r.name}</span><span class="bar"><i style="width:${r.v/max*100}%"></i></span><span class="v">${r.txt}</span><span class="s">${r.share!=null?num(r.share,1)+'%':''}</span></li>`).join('')}</ol>`; };

/* ---------- cada 100 ---------- */
SW2.waffle = (cats,cur) => { let sq=''; cats.forEach(c=>{for(let k=0;k<c.v;k++) sq+=`<i data-k="${c.k}" style="background:${c.c}"></i>`}); return `<div class="wf" role="img" aria-label="Cada 100 ${cur}, um quadrado por unidade">${sq}</div>`; };
SW2.waffleList = (cats,cur) => `<ul class="wl">${cats.map(c=>`<li data-k="${c.k}"><i style="background:${c.c}"></i><span>${c.name}</span><b>${cur} ${c.v}</b></li>`).join('')}</ul>`;
SW2.bindWaffle = el => { el.querySelectorAll('.wcol').forEach(col=>{
  const set=k=>{col.classList.toggle('dim',!!k); col.querySelectorAll('.wf i').forEach(i=>i.classList.toggle('hi',i.dataset.k===k));};
  col.addEventListener('mouseover',e=>{const t=e.target.closest('[data-k]'); set(t&&t.dataset.k);}); col.addEventListener('mouseleave',()=>set(null)); }); };

/* ---------- faixa do dia ---------- */
SW2.range = (r,f) => { if(!r) return `<div class="rng-n">Não varia ao longo do dia</div>`;
  const p=v=>((v-r.lo)/(r.hi-r.lo)*100).toFixed(1);
  return `<div class="rng" title="Faixa de variação do dia"><span>${f(r.lo)}</span><div class="rng-t"><s style="left:${p(r.open)}%" title="Abertura"></s><b style="left:${p(r.now)}%"></b></div><span>${f(r.hi)}</span></div>`; };

/* ---------- espera dependências (scripts do helmet) ---------- */
SW2.ready = fn => { const ok=()=>window.SW&&window.SW_DATA&&window.SW_GEO&&window.SW_X; if(ok()) return fn(); const t=setInterval(()=>{ if(ok()){clearInterval(t); fn();} },30); };
})();
