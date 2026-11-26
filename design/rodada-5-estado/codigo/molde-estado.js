// Molde da página de estado: mapa dos municípios + ranking longo + ficha. Independente de estado e de país:
// textos e abas vêm de SW_EST (sw-estado-config.js), a malha vem de SW_MUN[uf] (sw-mun-geo.js).
(function(){
const SWE = window.SWE = {};
const Q = SWE.Q = new URLSearchParams(location.search||location.hash.slice(1));
const E = () => window.SW_EST;
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = s => String(s).normalize('NFC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const isMob = () => matchMedia('(max-width:640px)').matches;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const tq = () => Q.get('theme')?`&theme=${Q.get('theme')}`:'';
const CHEV = `<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
const I = {
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
};
const ic = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
SWE.ic = ic;

SWE.url = (uf,tab,extra='') => `${E().page}?uf=${uf}${tab&&tab!=='geral'?`&tab=${tab}`:''}${extra}${tq()}`;
SWE.tab = (uf,k) => { const b=E().tabs[k]||{status:'off'}, o=((E().states[uf]||{}).tabs||{})[k]; return o?{...b,...o}:b; };
SWE.name = uf => E().names[uf][0];
SWE.de = uf => `${E().names[uf][1]} ${E().names[uf][0]}`;
SWE.em = uf => `${({do:'no',da:'na',de:'em'})[E().names[uf][1]]} ${E().names[uf][0]}`;
const tabLabel = k => { for(const g of SW2.TABS) for(const [kk,n] of g.items) if(kk===k) return n; return k; };

/* ---------- exemplo: campo suave só para pintar o molde (nenhum número aparece na tela) ---------- */
SWE.example = (G,key,nNull=3) => {
  let s=7; for(const ch of key) s=(s*31+ch.charCodeAt(0))%2147483647;
  const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  const W=[...Array(5)].map(()=>({a:r()*6.283,f:(.8+r()*3.2)*6.283/G.w,p:r()*6.283,w:.4+r()}));
  const out={};
  for(const [c,m] of Object.entries(G.mun)){ const [x,y]=m.c; let v=0; for(const o of W) v+=o.w*Math.sin((x*Math.cos(o.a)+y*Math.sin(o.a))*o.f+o.p); out[c]=v+(r()-.5)*1.4; }
  const codes=Object.keys(out).sort(); if(codes.length>8) for(let i=0;i<nNull;i++) out[codes[Math.floor(r()*codes.length)]]=null;
  return out;
};
SWE.quant = (vals,k=6) => { const a=vals.filter(v=>v!=null).sort((x,y)=>x-y); return [...Array(k-1)].map((_,i)=>a[Math.floor((i+1)*a.length/k)]); };

/* ---------- mapa com zoom ---------- */
SWE.Map = class {
  constructor(el,G,o){
    this.G=G; this.o=o; this.id='hm'+Math.random().toString(36).slice(2,7); this.codes=Object.keys(G.mun); this.lab={};
    el.innerHTML=`<div class="mm">
      <svg viewBox="0 0 ${G.w} ${G.h}" tabindex="0" role="img" aria-roledescription="mapa" aria-label="${esc(o.aria)}. Setas movem, mais e menos aproximam. Para escolher pelo teclado, use a busca ou o ranking.">
       <defs><pattern id="${this.id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:var(--bg)"/><line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--hatch);stroke-width:1.4"/></pattern></defs>
       <g class="g-m">${this.codes.map(c=>`<path class="mu" data-c="${c}" d="${G.mun[c].d}"></path>`).join('')}</g>
       <path class="rb" d="${G.regB}"/><path class="sb" d="${G.stB}"/>
       <path class="hov" d=""/><path class="sel2" d=""/><path class="sel" d=""/><g class="g-lab"></g>
      </svg>
      <div class="mm-z" role="group" aria-label="Zoom do mapa">
        <button type="button" data-z="in" aria-label="Aproximar" title="Aproximar">+</button>
        <button type="button" data-z="out" aria-label="Afastar" title="Afastar">−</button>
        <button type="button" data-z="fit" aria-label="Ver o estado inteiro" title="Ver o estado inteiro">${ic('fit')}</button>
      </div>
      <div class="mm-pick" hidden role="dialog" aria-label="Cidades neste ponto"></div>
    </div>`;
    this.frame=el.querySelector('.mm'); this.svg=el.querySelector('svg'); this.pick=el.querySelector('.mm-pick'); this.host=el;
    this.paths={}; this.svg.querySelectorAll('.mu').forEach(p=>this.paths[p.dataset.c]=p);
    this.size(); new ResizeObserver(()=>this.size()).observe(el);
    el.querySelector('.mm-z').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
      const z=b.dataset.z; if(z==='fit') this.fit(); else this.zoom(z==='in'?2:.5); });
    this.bindPointer(); this.bindKeys();
    this.pick.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; if(b.dataset.c) o.onClick(b.dataset.c,'pick'); this.closePick(); });
  }
  size(){
    const G=this.G, fw=this.host.clientWidth||800, mob=isMob();
    const fh=Math.round(Math.max(mob?300:360, Math.min(fw*G.h/G.w, mob?460:640)));
    this.frame.style.height=fh+'px'; this.fw=fw; this.fh=fh; this.ar=fw/fh;
    this.base=this.box([0,0,G.w,G.h],.02,0);
    if(!this.v || this.k()<=1.001) this.v=this.base; else { const cx=this.v.x+this.v.w/2, cy=this.v.y+this.v.h/2, w=this.v.w; this.v=this.clamp({x:cx-w/2,y:cy-w/this.ar/2,w,h:w/this.ar}); }
    this.apply(); this.labels();
  }
  k(){ return this.base.w/this.v.w; }
  box(b,pad,minW){ const bw=b[2]-b[0], bh=b[3]-b[1]; let w=Math.max(bw*(1+2*pad), bh*(1+2*pad)*this.ar, minW); const h=w/this.ar; return {x:(b[0]+b[2])/2-w/2, y:(b[1]+b[3])/2-h/2, w, h}; }
  clamp(v){ const B=this.base, minW=B.w/28; let w=Math.min(B.w,Math.max(minW,v.w)), h=w/this.ar;
    if(w>=B.w-1e-6) return {...B};
    let cx=v.x+v.w/2, cy=v.y+v.h/2; cx=Math.max(0,Math.min(this.G.w,cx)); cy=Math.max(0,Math.min(this.G.h,cy));
    return {x:cx-w/2,y:cy-h/2,w,h}; }
  apply(){ const v=this.v; this.svg.setAttribute('viewBox',`${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
    const z=this.k()>1.01; this.frame.classList.toggle('zoomed',z);
    const q=s=>this.host.querySelector(`[data-z="${s}"]`); q('out').disabled=!z; q('fit').disabled=!z; q('in').disabled=this.v.w<=this.base.w/28+1e-6; }
  to(t,anim=true){ t=this.clamp(t); cancelAnimationFrame(this.raf);
    if(!anim||calm()){ this.v=t; this.apply(); this.labels(); return; }
    const f={...this.v}, t0=performance.now(), D=360;
    const step=now=>{ const p=Math.min(1,(now-t0)/D), e=1-Math.pow(1-p,3); this.v={x:f.x+(t.x-f.x)*e,y:f.y+(t.y-f.y)*e,w:f.w+(t.w-f.w)*e,h:f.h+(t.h-f.h)*e}; this.apply();
      if(p<1) this.raf=requestAnimationFrame(step); else this.labels(); };
    this.labels(true); this.raf=requestAnimationFrame(step); }
  zoom(f,cx,cy){ const v=this.v; if(cx==null){cx=v.x+v.w/2; cy=v.y+v.h/2;} const w=v.w/f, h=v.h/f; this.to({x:cx-(cx-v.x)/f, y:cy-(cy-v.y)/f, w, h}); }
  fit(anim=true){ this.to(this.base,anim); }
  fitBox(b,anim=true){ this.to(this.box(b,.06,0),anim); }
  focus(c,anim=true){ const m=this.G.mun[c]; if(!m) return; const B=this.base; this.to(this.box(m.b,.9,B.w/9),anim); }
  pt(cx,cy){ const r=this.svg.getBoundingClientRect(), v=this.v; return [v.x+(cx-r.left)/r.width*v.w, v.y+(cy-r.top)/r.height*v.h]; }
  bindPointer(){
    const svg=this.svg, P=new Map(); let s=null, moved=false, pinch=null;
    const hit=e=>{ const t=e.target.closest&&e.target.closest('.mu'); return t&&!t.classList.contains('out')?t.dataset.c:null; };
    svg.addEventListener('pointerover',e=>{ if(e.pointerType==='mouse'&&!P.size) this.o.onHover(hit(e)); });
    svg.addEventListener('pointerleave',e=>{ if(e.pointerType==='mouse') this.o.onHover(null); });
    svg.addEventListener('pointerdown',e=>{ P.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(P.size===1){ s={x:e.clientX,y:e.clientY,v:{...this.v},type:e.pointerType,c:hit(e)}; moved=false; }
      if(P.size===2){ const [a,b]=[...P.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,v:{...this.v},m:this.pt((a.x+b.x)/2,(a.y+b.y)/2)}; moved=true; cancelAnimationFrame(this.raf); } });
    svg.addEventListener('pointermove',e=>{ if(!P.has(e.pointerId)) return; P.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const r=svg.getBoundingClientRect();
      if(P.size===2&&pinch){ e.preventDefault(); const [a,b]=[...P.values()], f=Math.hypot(a.x-b.x,a.y-b.y)/pinch.d, w=pinch.v.w/f, h=w/this.ar;
        const mx=((a.x+b.x)/2-r.left)/r.width, my=((a.y+b.y)/2-r.top)/r.height;
        this.v=this.clamp({x:pinch.m[0]-mx*w,y:pinch.m[1]-my*h,w,h}); this.apply(); return; }
      if(P.size===1&&s){ const dx=e.clientX-s.x, dy=e.clientY-s.y;
        if(!moved&&Math.hypot(dx,dy)>5&&this.k()>1.01){ moved=true; this.frame.classList.add('drag'); try{svg.setPointerCapture(e.pointerId)}catch(_){} }
        if(moved){ this.v=this.clamp({...s.v,x:s.v.x-dx/r.width*s.v.w,y:s.v.y-dy/r.height*s.v.h}); this.apply(); } } });
    const up=e=>{ if(!P.has(e.pointerId)) return; P.delete(e.pointerId); this.frame.classList.remove('drag');
      if(P.size===1){ pinch=null; const [a]=[...P.values()]; s={x:a.x,y:a.y,v:{...this.v},type:'touch'}; return; }
      if(P.size===0){ if(!moved&&s&&e.type==='pointerup') this.tap(e,s); else this.labels(); s=null; pinch=null; } };
    svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up);
    svg.addEventListener('dblclick',e=>{ const [x,y]=this.pt(e.clientX,e.clientY); this.zoom(2,x,y); });
    svg.addEventListener('wheel',e=>{ if(!(e.ctrlKey||e.metaKey)) return; e.preventDefault(); const [x,y]=this.pt(e.clientX,e.clientY); cancelAnimationFrame(this.raf);
      const f=Math.exp(-e.deltaY*.004), v=this.v, w=v.w/f; this.v=this.clamp({x:x-(x-v.x)/f,y:y-(y-v.y)/f,w,h:w/this.ar}); this.apply(); clearTimeout(this.wt); this.wt=setTimeout(()=>this.labels(),120); },{passive:false});
  }
  tap(e,s){
    const c=s.c; if(s.type==='mouse'){ if(c) this.o.onClick(c,'map'); return; }
    // toque: se houver várias cidades pequenas sob o dedo, abre a lista do ponto
    const [x,y]=this.pt(e.clientX,e.clientY), R=18*this.v.w/this.fw, M=this.G.mun;
    const near=this.codes.filter(k=>!this.paths[k].classList.contains('out')).map(k=>{ const b=M[k].b, dx=Math.max(b[0]-x,0,x-b[2]), dy=Math.max(b[1]-y,0,y-b[3]); return [k,Math.hypot(dx,dy)+(k===c?0:.001)]; })
      .filter(([,d])=>d<=R).sort((a,b)=>a[1]-b[1]).map(([k])=>k).filter(k=>k===c||(M[k].b[2]-M[k].b[0])/this.v.w*this.fw<44);
    if(c&&!near.includes(c)) near.unshift(c);
    if(near.length>1) this.openPick(near.slice(0,6)); else if(c) this.o.onClick(c,'map');
  }
  openPick(list){ const M=this.G.mun, R=this.G.regions;
    this.pick.innerHTML=`<div class="mm-pick-h"><span>${list.length} cidades neste ponto</span><button type="button" class="fld-x" aria-label="Fechar">${ic('x')}</button></div>
      <ul>${list.map(k=>`<li><button type="button" data-c="${k}">${esc(M[k].n)}<span>${esc(R[M[k].r].n)}</span></button></li>`).join('')}</ul>`;
    this.pick.hidden=false; const b=this.pick.querySelector('li button'); b&&b.focus({preventScroll:true}); }
  closePick(){ this.pick.hidden=true; }
  bindKeys(){ this.svg.addEventListener('keydown',e=>{ const v=this.v, d=v.w*.12;
    const mv={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[e.key];
    if(mv){ e.preventDefault(); this.to({...v,x:v.x+mv[0],y:v.y+mv[1]}); }
    else if(e.key==='+'||e.key==='='){ e.preventDefault(); this.zoom(2); }
    else if(e.key==='-'||e.key==='_'){ e.preventDefault(); this.zoom(.5); }
    else if(e.key==='0'){ e.preventDefault(); this.fit(); }
    else if(e.key==='Escape') this.closePick(); });
    this.pick.addEventListener('keydown',e=>{ if(e.key==='Escape'){ this.closePick(); this.svg.focus(); } }); }
  update(fill){ for(const c of this.codes){ const r=fill(c), p=this.paths[c]; p.classList.toggle('out',!!r.out); p.style.fill=r.out?'':r.hatch?`url(#${this.id})`:r.f; } }
  mark(sel,hov){ const M=this.G.mun, q=s=>this.svg.querySelector(s); const d=sel&&M[sel]?M[sel].d:'';
    q('.sel').setAttribute('d',d); q('.sel2').setAttribute('d',d); q('.hov').setAttribute('d',hov&&hov!==sel&&M[hov]?M[hov].d:'');
    if(sel!==this.lab.sel){ this.lab.sel=sel; this.labels(); } }
  labels(hide){
    const g=this.svg.querySelector('.g-lab'); if(hide){ g.style.opacity=0; return; } g.style.opacity=1;
    const M=this.G.mun, v=this.v, s=v.w/this.fw, fs=13*s, sel=this.lab.sel, cap=this.o.capital, boxes=[]; let h='';
    const inView=([x,y])=>x>v.x&&x<v.x+v.w&&y>v.y&&y<v.y+v.h;
    const fits=(x,y,w)=>{ const b=[x-w/2,y-fs,x+w/2,y+fs*.3]; if(boxes.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1])) return false; boxes.push(b); return true; };
    const tw=n=>n.length*fs*.56;
    const put=(c,cls,dy=0)=>{ const m=M[c]; if(!m||!inView(m.c)) return; const y=m.c[1]+dy, w=tw(m.n); if(!fits(m.c[0],y,w)) return;
      h+=`<text class="ml ${cls}" x="${m.c[0]}" y="${y}" text-anchor="middle" style="font-size:${fs}px;stroke-width:${3.2*s}px">${esc(m.n)}</text>`; };
    if(sel&&M[sel]){ const m=M[sel]; put(sel,'s',-(m.c[1]-m.b[1])-6*s); }
    if(cap&&M[cap]&&!this.paths[cap].classList.contains('out')){ const m=M[cap]; if(inView(m.c)){ h+=`<circle class="cap" cx="${m.c[0]}" cy="${m.c[1]}" r="${3.5*s}"/>`; if(cap!==sel) put(cap,'',-7*s); } }
    if(this.k()>=2.2){ this.codes.filter(c=>c!==sel&&c!==cap&&!this.paths[c].classList.contains('out')&&inView(M[c].c)&&(M[c].b[2]-M[c].b[0])/s>tw(M[c].n)/s*.9)
      .sort((a,b)=>M[b].a-M[a].a).slice(0,40).forEach(c=>put(c,'',fs*.35)); }
    g.innerHTML=h;
  }
};

/* ---------- busca (combobox) ---------- */
SWE.Search = class {
  constructor(o){ // o:{items:[{c,n,sub}], onPick, label, placeholder, empty}
    this.o=o; const id=this.id='cb'+Math.random().toString(36).slice(2,7);
    o.items.forEach(i=>i.k=norm(i.n));
    const el=this.el=document.createElement('div'); el.className='cb';
    el.innerHTML=`<label class="sr" for="${id}i">${o.label}</label><div class="fld">${ic('search')}<input id="${id}i" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}l" autocomplete="off" spellcheck="false" placeholder="${esc(o.placeholder)}"><button type="button" class="fld-x" aria-label="Limpar busca" hidden>${ic('x')}</button></div><ul class="cb-l" id="${id}l" role="listbox" aria-label="Resultados" hidden></ul>`;
    this.inp=el.querySelector('input'); this.list=el.querySelector('ul'); this.x=el.querySelector('.fld-x');
    this.inp.addEventListener('input',()=>this.run());
    this.inp.addEventListener('focus',()=>{ if(this.inp.value.trim()) this.run(); });
    this.inp.addEventListener('blur',()=>setTimeout(()=>{ if(!el.contains(document.activeElement)) this.close(); },120));
    this.inp.addEventListener('keydown',e=>{ const n=(this.m||[]).length;
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); if(this.list.hidden) return this.run(); if(!n) return; this.act=(this.act+(e.key==='ArrowDown'?1:-1)+n)%n; this.paint(); }
      else if(e.key==='Enter'){ if(!this.list.hidden&&this.act>=0){ e.preventDefault(); this.pick(this.act); } }
      else if(e.key==='Escape'){ if(!this.list.hidden){ e.preventDefault(); this.close(); } else { this.inp.value=''; this.x.hidden=true; } } });
    this.list.addEventListener('pointerdown',e=>e.preventDefault());
    this.list.addEventListener('click',e=>{ const li=e.target.closest('li[data-i]'); if(li) this.pick(+li.dataset.i); });
    this.x.addEventListener('click',()=>{ this.inp.value=''; this.x.hidden=true; this.close(); this.inp.focus(); });
  }
  run(keep){ const q=norm(this.inp.value.trim()); this.x.hidden=!q; if(!q){ this.close(); return; }
    const it=this.o.items, a=it.filter(i=>i.k.startsWith(q)), b=it.filter(i=>!i.k.startsWith(q)&&i.k.includes(q));
    this.m=[...a,...b].slice(0,8); this.q=q; const ki=keep?this.m.findIndex(i=>i.c===keep):-1; this.act=ki>=0?ki:(this.m.length?0:-1); this.paint(); }
  paint(){ const q=this.q, id=this.id;
    this.list.innerHTML=this.m.length? this.m.map((i,j)=>{ const p=i.k.indexOf(q), nm=p<0?esc(i.n):esc(i.n.slice(0,p))+'<b>'+esc(i.n.slice(p,p+q.length))+'</b>'+esc(i.n.slice(p+q.length));
        return `<li id="${id}o${j}" role="option" data-i="${j}" aria-selected="${j===this.act}" class="${j===this.act?'act':''}"><span class="nm">${nm}</span><small>${esc(i.sub)}</small></li>`; }).join('')
      : `<li class="cb-e" role="option" aria-disabled="true">${esc(this.o.empty)}</li>`;
    this.list.hidden=false; this.inp.setAttribute('aria-expanded','true');
    if(this.act>=0) this.inp.setAttribute('aria-activedescendant',`${id}o${this.act}`); else this.inp.removeAttribute('aria-activedescendant'); }
  close(){ this.list.hidden=true; this.inp.setAttribute('aria-expanded','false'); this.inp.removeAttribute('aria-activedescendant'); }
  pick(j){ const i=this.m[j]; if(!i) return; this.inp.value=i.n; this.close(); this.o.onPick(i.c); }
  open(text,keep){ this.inp.value=text; this.run(keep); }
};

/* ---------- ranking longo ---------- */
SWE.Rank = class {
  constructor(el,o){ // o:{G, onClick, onHover, onOrder, unit, units}
    this.el=el; this.o=o; this.n=0; const id='rk'+Math.random().toString(36).slice(2,7);
    el.innerHTML=`<div class="rk-tools"><div class="rk-srch"></div><div class="rk-top"><h3 class="sec-h" id="${id}h">Ranking</h3>
      <div class="seg sm" role="radiogroup" aria-label="Ordem do ranking"><button type="button" role="radio" data-act="desc">Maiores</button><button type="button" role="radio" data-act="asc">Menores</button></div></div></div><div class="rk-body"></div>`;
    this.body=el.querySelector('.rk-body'); this.srch=el.querySelector('.rk-srch'); this.hid=id+'h';
    el.addEventListener('pointerover',e=>{ if(e.pointerType!=='mouse') return; const li=e.target.closest('li[data-c]'); if(li) o.onHover(li.dataset.c); });
    this.body.addEventListener('mouseleave',()=>o.onHover(null));
    el.addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(b) return this.act(b.dataset.act); const li=e.target.closest('li[data-c]'); if(li) o.onClick(li.dataset.c,'rank'); });
    el.addEventListener('keydown',e=>{ const li=e.target.closest('li[data-c]'); if(!li) return;
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); o.onClick(li.dataset.c,'rank'); return; }
      if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return; e.preventDefault();
      const all=[...this.body.querySelectorAll('li[data-c]')]; let i=all.indexOf(li);
      i=e.key==='Home'?0:e.key==='End'?all.length-1:Math.max(0,Math.min(all.length-1,i+(e.key==='ArrowDown'?1:-1)));
      all.forEach(x=>x.tabIndex=-1); all[i].tabIndex=0; all[i].focus(); o.onHover(all[i].dataset.c); });
  }
  act(a){ const st=this.st;
    if(a==='desc'||a==='asc'){ if(st.ord!==a) this.o.onOrder(a); return; }
    if(a==='more') this.n=this.n?this.n+50:50;
    if(a==='less') this.n=0;
    if(a==='goto'){ const i=this.sorted.findIndex(r=>r.c===st.sel); if(i<0) return; if(!this.n||this.n<=i) this.n=Math.ceil((i+1)/50)*50; this.render(st); this.scrollTo(st.sel,true); return; }
    this.render(st);
  }
  scrollTo(c,focus){ const li=this.body.querySelector(`li[data-c="${c}"]`); if(!li) return; const y=li.getBoundingClientRect().top+window.scrollY-Math.round(innerHeight*.4);
    window.scrollTo({top:y,behavior:calm()?'auto':'smooth'}); if(focus) setTimeout(()=>li.focus({preventScroll:true}),calm()?0:400); }
  render(st){ // {rows:[{c,v,txt}], sel, hov, col, ord, scope}
    this.st=st; const M=this.o.G.mun, nm=c=>M[c].n;
    this.el.querySelectorAll('[role=radio]').forEach(b=>{ const on=b.dataset.act===st.ord; b.classList.toggle('on',on); b.setAttribute('aria-checked',on); });
    const val=st.rows.filter(r=>r.v!=null).sort((a,b)=>b.v-a.v), nul=st.rows.filter(r=>r.v==null).sort((a,b)=>nm(a.c).localeCompare(nm(b.c),'pt'));
    val.forEach((r,i)=>r.pos=i+1);
    const sorted=this.sorted=(st.ord==='asc'?[...val].reverse():val).concat(nul), N=sorted.length;
    const lo=val.length?val[val.length-1].v:0, hi=val.length?val[0].v:1, w=v=>6+94*(v-lo)/((hi-lo)||1);
    const row=r=>{ const nd=r.v==null, on=r.c===st.sel;
      return `<li data-c="${r.c}" role="option" tabindex="${on?0:-1}" aria-selected="${on}" class="${on?'on':''} ${r.c===st.hov?'hv':''}"><span class="n">${nd?'—':r.pos}</span><span class="nm">${esc(nm(r.c))}</span><span class="bar ${nd?'h':''}">${nd?'':`<i style="width:${w(r.v)}%"></i>`}</span><span class="v ${nd?'nd':''}">${nd?'sem dado':r.txt}</span></li>`; };
    const TOP=N<=15?N:10, si=sorted.findIndex(r=>r.c===st.sel); let list;
    if(!this.n){ list=sorted.slice(0,TOP).map(row).join(''); if(si>=TOP) list+=`<li class="gap" aria-hidden="true">···</li>`+row(sorted[si]); }
    else list=sorted.slice(0,this.n).map(row).join('');
    const shown=this.n?Math.min(this.n,N):TOP, u=this.o.units;
    const pin=this.n&&si>=0?`<div class="rk-pin" role="status"><small>Sua cidade</small><b>${esc(nm(st.sel))}</b><span>${sorted[si].v==null?'sem dado nesta medida':`000º de ${N} ${st.scope}`}</span>${si>=shown||true?`<button type="button" class="lk" data-act="goto">Ir para a posição</button>`:''}</div>`:'';
    let more='';
    if(N>TOP){ more=this.n?`<div>${shown<N?`<button class="more" type="button" data-act="more">Mostrar mais ${Math.min(50,N-shown)}</button>`:''}<button class="more" type="button" data-act="less">Recolher</button></div><span>${shown<N?`1 a ${shown} de ${N}`:`Todos os ${N}`}</span>`
      : `<button class="more" type="button" data-act="more" aria-expanded="false">Ver todos os ${N} ${u}</button><span>${st.ord==='asc'?'Do menor para o maior':''}</span>`; }
    this.body.innerHTML=`${pin}<div class="rk-h"><span>${this.o.Unit}</span><span>${esc(st.col)}</span></div>
      <ul class="rk" role="listbox" aria-labelledby="${this.hid}">${list}</ul>${more?`<div class="rk-more">${more}</div>`:''}`;
  }
};

/* ---------- troca de estado na trilha ---------- */
SWE.picker = (wrap,uf,tab) => {
  const X=E(), U=window.SW_DATA.UNITS;
  wrap.innerHTML=`<button type="button" class="pk-b" aria-haspopup="dialog" aria-expanded="false" aria-controls="pk-pop">${esc(SWE.name(uf))}${CHEV}<span class="sr">, trocar de estado</span></button>
    <div class="pk-pop" id="pk-pop" role="dialog" aria-label="Trocar de estado" hidden><div class="fld">${ic('search')}<input type="text" placeholder="Buscar estado" aria-label="Buscar estado" autocomplete="off" spellcheck="false"></div><div class="pk-l"></div></div>`;
  const b=wrap.querySelector('.pk-b'), pop=wrap.querySelector('.pk-pop'), inp=pop.querySelector('input'), L=pop.querySelector('.pk-l');
  const paint=()=>{ const q=norm(inp.value.trim()); let h='';
    for(const g of X.groups){ const us=Object.keys(X.names).filter(u=>U[u][1]===g&&(!q||norm(X.names[u][0]).includes(q)||u.toLowerCase()===q)).sort((a,b)=>X.names[a][0].localeCompare(X.names[b][0],'pt'));
      if(us.length) h+=`<div role="group" aria-label="${g}"><div class="pk-g" aria-hidden="true">${g}</div>${us.map(u=>`<a href="${SWE.url(u,tab)}"${u===uf?' aria-current="page"':''}>${esc(X.names[u][0])}<span>${u===uf?'atual':u}</span></a>`).join('')}</div>`; }
    L.innerHTML=h||`<div class="pk-e">Nenhum estado com esse nome.</div>`; };
  const open=o=>{ pop.hidden=!o; b.setAttribute('aria-expanded',o); if(o){ paint(); } };
  b.addEventListener('click',()=>{ const o=pop.hidden; open(o); if(o) inp.focus({preventScroll:true}); });
  inp.addEventListener('input',paint);
  pop.addEventListener('keydown',e=>{ const as=[...L.querySelectorAll('a')], i=as.indexOf(document.activeElement);
    if(e.key==='Escape'){ open(false); b.focus(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); (as[i+1]||as[0])&&(as[i+1]||as[0]).focus(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(i<=0) inp.focus(); else as[i-1].focus(); }
    else if(e.key==='Enter'&&e.target===inp&&as[0]){ location.href=as[0].href; } });
  document.addEventListener('click',e=>{ if(!wrap.contains(e.target)) open(false); });
  return {open};
};

/* ---------- página ---------- */
SWE.mount = root => {
  const $=s=>root.querySelector(s), X=E(), C=X.country;
  const uf=(Q.get('uf')||'SP').toUpperCase(), tab=Q.get('tab')||'geral', T=SWE.tab(uf,tab), S=X.states[uf]||{}, G=(window.SW_MUN||{})[uf], name=SWE.name(uf);
  SW2.href = k => SWE.tab(uf,k).status==='off'?null:SWE.url(uf,k);
  const home=encodeURI(C.home)+(Q.get('theme')?`?theme=${Q.get('theme')}`:'');
  $('#hdr').innerHTML=SW.header('Economia').replace(/Economia do Brasil\.html/g,home);
  $('#themeBtn').onclick=SW.toggleTheme; SW.syncThemeBtn();
  $('#crumb').innerHTML=`<a href="#">Economia</a><span aria-hidden="true">/</span><a href="${home}">${C.name}</a><span aria-hidden="true">/</span><div class="pk"></div>${tab!=='geral'?`<span aria-hidden="true">/</span><span aria-current="page">${tabLabel(tab)}</span>`:''}`;
  const pk=SWE.picker($('.pk'),uf,tab);
  $('#title').textContent=`A economia ${SWE.de(uf)}`;
  document.title=`${tab==='geral'?'Visão geral':tabLabel(tab)} · A economia ${SWE.de(uf)} · StatWorld`;
  if(G){ const cap=G.mun[S.capital], nR=Object.keys(G.regions).length, nM=Object.keys(G.mun).length;
    $('#sum').innerHTML=`<div class="est-sum"><span><b>${nM.toLocaleString('pt-BR')}</b> ${nM===1?C.unit:C.units}</span><span><b>${nR}</b> ${nR===1?'região intermediária':C.regionKind}</span>${cap?`<span>Capital: <b>${esc(cap.n)}</b></span>`:''}<span>Região ${window.SW_DATA.UNITS[uf][1]}</span></div>`; }
  SW2.mountNav($('#tabs'),tab);
  if(Q.get('crumb')) setTimeout(()=>pk.open(true),50);
  const body=$('#body'), live=$('#live');
  const st=T.status;
  if(st==='mun'&&!G){ body.innerHTML=`<section class="est-empty"><h2>Mapa dos ${C.units} ${SWE.de(uf)}</h2><p>A malha dos ${C.units} deste estado ainda não foi carregada.</p></section>`; return; }
  if(st==='mun') return munPage(body,{uf,tab,T,S,G,name,C,live});
  if(st==='estado') return statePage(body,{uf,tab,T,name,C});
  return emptyPage(body,{uf,tab,T,name,C,st});
};

const stampEx = (M) => SW2.stamp(`${M.src} · ${E().PH_DATE}`,M.f);
const segHtml = (ms,cur) => ms.map(m=>`<button role="tab" data-k="${m.k}" class="${m.k===cur?'on':''}" aria-selected="${m.k===cur}">${m.label}</button>`).join('');

function munPage(body,{uf,tab,T,S,G,name,C,live}){
  const ms=T.measures, codes=Object.keys(G.mun), R=G.regions, nAll=codes.length;
  const st={m:ms.some(x=>x.k===Q.get('m'))?Q.get('m'):ms[0].k, sel:String(Q.get('sel')||S.sel||codes[0]), hov:null, reg:R[Q.get('reg')]?Q.get('reg'):'', ord:Q.get('ord')==='asc'?'asc':'desc'};
  const one=ms.length===1;
  body.innerHTML=`<div class="ctrl">${one?`<div class="seg" role="presentation"><button class="on" aria-current="true" tabindex="-1">${ms[0].label}</button></div>`:`<div class="seg" id="seg" role="tablist" aria-label="Medida"></div>`}<div id="vstamp"></div></div>
    <div class="grid">
      <div>
        <div class="vh"><div><h2 id="vt"></h2><p id="vs"></p></div></div>
        <div class="mtools" id="mtools"></div>
        <div id="map"></div><div id="legend"></div>
        <p class="mm-hint" id="hint"></p>
      </div>
      <aside class="side" aria-label="Ficha e ranking"><div id="card"></div><div id="rank"></div><p class="srcnote" id="src"></p></aside>
    </div>
    <div class="ad" role="complementary" aria-label="Publicidade">Publicidade</div>`;
  const $=id=>body.querySelector('#'+id);
  const data={}, D=()=>data[st.m]||(data[st.m]=SWE.example(G,uf+tab+st.m,nAll>40?3:1));
  const inReg=c=>!st.reg||String(G.mun[c].r)===st.reg;
  const scopeN=()=>st.reg?R[st.reg].count:nAll;
  const scope=()=>st.reg?`na região de ${R[st.reg].n}`:C.units;

  // região: select nativo (teclado e leitor de tela de graça)
  const regWrap=document.createElement('div'); regWrap.className='sel-w';
  const rid='reg'+Math.random().toString(36).slice(2,6);
  regWrap.innerHTML=`<label class="sr" for="${rid}">Região do estado</label><select id="${rid}"><option value="">Todo o estado · ${nAll}</option>${Object.entries(R).sort((a,b)=>a[1].n.localeCompare(b[1].n,'pt')).map(([k,r])=>`<option value="${k}">Região de ${esc(r.n)} · ${r.count}</option>`).join('')}</select>${CHEV}`;
  const regSel=regWrap.querySelector('select'); regSel.value=st.reg;
  const clr=document.createElement('button'); clr.type='button'; clr.className='lk'; clr.textContent='Ver o estado inteiro';
  const search=new SWE.Search({label:`Buscar ${C.unit} ${SWE.em(uf)}`,placeholder:'Digite sua cidade',empty:`Nenhum ${C.unit} com esse nome ${SWE.em(uf)}.`,
    items:codes.map(c=>({c,n:G.mun[c].n,sub:R[G.mun[c].r].n})).sort((a,b)=>a.n.localeCompare(b.n,'pt')),onPick:c=>pick(c,'search')});
  const map=new SWE.Map($('map'),G,{aria:`Mapa dos ${nAll} ${C.units} ${SWE.de(uf)}`,capital:S.capital,onHover:c=>{st.hov=c;draw()},onClick:(c,from)=>pick(c,from)});
  const rank=new SWE.Rank($('rank'),{G,Unit:C.Unit,units:C.units,onHover:c=>{st.hov=c;draw()},onClick:c=>pick(c,'rank'),onOrder:o=>{st.ord=o;draw()}});
  const place=()=>{ const mob=isMob(), mt=$('mtools'); mt.append(regWrap,clr); if(mob) mt.prepend(search.el); else rank.srch.append(search.el);
    $('hint').textContent=mob?'Pinça ou + e − para aproximar. Tocou em cidade pequena? Abre a lista do ponto.':'Clique duas vezes ou use + e − para aproximar. Arraste para mover.'; };
  place(); matchMedia('(max-width:640px)').addEventListener('change',()=>{ place(); });
  regSel.addEventListener('change',()=>setReg(regSel.value));
  clr.addEventListener('click',()=>{ regSel.value=''; setReg(''); });
  body.addEventListener('click',e=>{ const b=e.target.closest('[data-reg]'); if(b){ regSel.value=b.dataset.reg; setReg(b.dataset.reg); } });
  if(!one){ $('seg').innerHTML=segHtml(ms,st.m); $('seg').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; st.m=b.dataset.k; $('seg').innerHTML=segHtml(ms,st.m); draw(true); }; }

  const setReg=v=>{ st.reg=v; rank.n=0; regWrap.classList.toggle('on',!!v);
    if(v&&!inReg(st.sel)){ const d=D(); st.sel=codes.filter(inReg).sort((a,b)=>(d[b]??-1e9)-(d[a]??-1e9))[0]; }
    draw(true); if(v) map.fitBox(R[v].b); else map.fit();
    live.textContent=v?`Mostrando só os ${R[v].count} ${C.units} da região de ${R[v].n}.`:`Mostrando os ${nAll} ${C.units} ${SWE.de(uf)}.`; };
  const pick=(c,from)=>{ if(!G.mun[c]) return; st.sel=String(c); st.hov=null;
    if(st.reg&&!inReg(st.sel)){ st.reg=''; regSel.value=''; regWrap.classList.remove('on'); draw(true); }
    draw(); if(from==='search'||from==='rank'||from==='pick') map.focus(st.sel);
    if(from==='map'||from==='pick') search.inp.value='';
    live.textContent=`${G.mun[st.sel].n} escolhida.`; };

  const draw=full=>{
    const M=ms.find(x=>x.k===st.m), d=D();
    if(full){
      const cuts=SWE.quant(codes.map(c=>d[c]));
      map.update(c=>!inReg(c)?{out:true}:d[c]==null?{hatch:true}:{f:`var(--r${SW.cls(d[c],cuts)})`});
      $('vt').textContent=`${M.title} ${st.reg?`nos ${R[st.reg].count} ${C.units} da região de ${R[st.reg].n}`:`nos ${nAll} ${C.units} ${SWE.de(uf)}`}`;
      $('vs').textContent=M.sub;
      $('vstamp').innerHTML=stampEx(M);
      clr.hidden=!st.reg;
      $('legend').innerHTML=`<div class="legend"><div class="ramp">${E().LEG.map((l,i)=>`<div><i style="background:var(--r${i})"></i>${l}</div>`).join('')}</div><div class="lg-h"><i></i>Sem dado</div><div class="lg-l"><i></i>Divisa de região</div>${st.reg?`<div class="lg-h lg-z"><i></i>Fora da região</div>`:''}</div>`;
      $('src').innerHTML=`<b>Fonte:</b> números de exemplo, no formato de ${M.src}. Regiões: ${C.regionSrc}. Malha: IBGE.`;
    }
    map.mark(st.sel,st.hov);
    const show=st.hov||st.sel, m=G.mun[show], v=d[show], nd=v==null, reg=R[m.r].n;
    $('card').innerHTML=`<div class="card" aria-live="polite">
      <div class="meta">Região de ${esc(reg)}${show===S.capital?' · capital':''}${!st.reg&&show===st.sel&&Object.keys(R).length>1?` · <button type="button" class="lk" data-reg="${m.r}">ver só esta região</button>`:''}</div>
      <div class="row1"><div class="nm">${esc(m.n)}</div>${nd?`<div class="nodata"><span class="sw-h" style="width:22px;height:14px"></span>Sem dado</div>`:`<div class="big">${M.big}</div>`}</div>
      ${nd?`<div class="facts"><div class="fact"><span>${M.label}</span><b>a fonte não traz este ${C.unit}</b></div></div>`:`<div class="facts">
        <div class="fact"><span>Posição no estado</span><b>000º de ${nAll}</b></div>
        ${st.reg?`<div class="fact"><span>Posição na região</span><b>000º de ${R[st.reg].count}</b></div>`:''}
        ${M.br?`<div class="fact"><span>Posição no ${C.name}</span><b>0.000º de ${C.total}</b></div>`:''}
        <div class="fact"><span>Média do estado</span><b>${M.ph}</b></div>
        <div class="fact"><span>Diferença para a média</span><b>${M.diff}</b></div></div>`}
      <div style="margin-top:8px">${stampEx(M)}</div>
      <div class="go"><span>Ver página de ${esc(m.n)}</span><em class="soon">em breve</em></div></div>`;
    rank.render({rows:codes.filter(inReg).map(c=>({c,v:d[c],txt:M.ph})),sel:st.sel,hov:st.hov,col:M.col,ord:st.ord,scope:st.reg?`na região`:`${C.units}`});
  };
  // posição pedida pela URL (para as telas do molde): pos=312 escolhe quem está nessa posição do exemplo
  if(Q.get('pos')){ const d=D(), o=codes.filter(c=>d[c]!=null).sort((a,b)=>d[b]-d[a]); st.sel=o[Math.min(o.length,+Q.get('pos'))-1]||st.sel; }
  regWrap.classList.toggle('on',!!st.reg);
  if(Q.get('more')) rank.n=+Q.get('more');
  draw(true);
  if(st.reg) map.fitBox(R[st.reg].b,false);
  if(Q.get('zoom')==='sel') map.focus(st.sel,false);
  if(Q.get('q')) setTimeout(()=>search.open(Q.get('q'),st.sel),60);
  const sc=Q.get('scroll');
  if(sc) setTimeout(()=>{ const el=sc==='rank'?(isMob()?$('rank'):rank.body.querySelector('.rk-pin')||$('rank')):sc==='search'?search.el:$(sc); if(el) window.scrollTo(0,el.getBoundingClientRect().top+scrollY-16); },300);
}

function statePage(body,{uf,tab,T,name,C}){
  const ms=T.measures, U=window.SW_DATA.UNITS; let m=ms.some(x=>x.k===Q.get('m'))?Q.get('m'):ms[0].k;
  body.innerHTML=`<div class="ctrl"><div class="seg" id="seg" role="tablist" aria-label="Medida"></div><div id="vstamp"></div></div>
    ${SW2.note(`<b>Este dado não existe por ${C.unit}.</b> ${T.why}`)}
    <div class="grid">
      <div><div class="vh"><div><h2 id="vt"></h2><p id="vs"></p></div></div><div id="chart" style="margin-top:12px"></div></div>
      <aside class="side"><div id="card"></div><p class="srcnote" id="src"></p></aside>
    </div>
    <div class="ad" role="complementary" aria-label="Publicidade">Publicidade</div>`;
  const $=id=>body.querySelector('#'+id);
  // série de exemplo: só a forma da linha; eixos e valores ficam como 00,0
  const pts=[]; for(let y=2012;y<=2026;y++) for(const q of [2,5,8,11]){ if(y===2026&&q>8) break; const t=y+q/12; pts.push([new Date(y,q,1),5+2.2*Math.sin((t-2012)/2.3)+1.2*Math.sin((t-2012)/1.1)]); }
  const draw=()=>{ const M=ms.find(x=>x.k===m);
    $('seg').innerHTML=segHtml(ms,m);
    $('vt').textContent=`${M.title} ${SWE.em(uf)}, desde 2012`; $('vs').textContent=M.sub;
    $('vstamp').innerHTML=stampEx(M);
    SW2.line($('chart'),{pts,W:900,H:380,fmtY:()=>M.ph,tip:()=>['mmm 0000',M.ph],aria:`${M.title} ${SWE.em(uf)} no tempo, série de exemplo`});
    $('card').innerHTML=`<div class="card" aria-live="polite">
      <div class="meta">Região ${U[uf][1]} · número do estado inteiro</div>
      <div class="row1"><div class="nm">${esc(name)}</div><div class="big">${M.big}</div></div>
      <div class="facts"><div class="fact"><span>Posição entre os estados</span><b>00º de ${C.nStates}</b></div><div class="fact"><span>${M.avg}</span><b>${M.ph}</b></div><div class="fact"><span>Diferença para o ${C.name}</span><b>${M.diff}</b></div><div class="fact"><span>${M.prev}</span><b>${M.ph}</b></div></div>
      <div style="margin-top:8px">${stampEx(M)}</div>
      <a class="go" href="${encodeURI(T.brasil)}${Q.get('theme')?`?theme=${Q.get('theme')}`:''}">Ver o mapa dos ${C.nStates} ${C.states}${ic('arrow')}</a></div>`;
    $('src').innerHTML=`<b>Fonte:</b> números de exemplo, no formato de ${M.src}.`; };
  $('seg').onclick=e=>{ const b=e.target.closest('button'); if(b){ m=b.dataset.k; draw(); } };
  draw();
}

function emptyPage(body,{uf,tab,T,name,C,st}){
  const lbl=tabLabel(tab), th=Q.get('theme')?`?theme=${Q.get('theme')}`:'';
  const also=Object.keys(E().tabs).filter(k=>k!==tab&&SWE.tab(uf,k).status==='mun');
  const alsoH=also.length?`<div class="est-also"><span>Com mapa dos ${C.units} ${SWE.de(uf)}:</span>${also.map(k=>`<a href="${SWE.url(uf,k)}">${tabLabel(k)}</a>`).join('')}</div>`:'';
  body.innerHTML= st==='soon'
    ? `<section class="est-empty" aria-labelledby="ee"><h2 id="ee">${lbl} ${SWE.de(uf)}<em class="soon">em breve</em></h2>
        <p>A fonte existe, a página ainda não foi feita. <b>Fonte prevista:</b> ${esc(T.src)}.</p>
        <a class="lnk" href="${encodeURI(T.brasil)}${th}">Enquanto isso, ver ${lbl} do ${C.name}${ic('arrow')}</a>${alsoH}</section>`
    : `<section class="est-empty" aria-labelledby="ee"><h2 id="ee">${lbl} não tem dado por estado</h2>
        <p>${esc(T.why)}</p>
        <a class="lnk" href="${encodeURI(T.brasil)}${th}">Ver ${lbl} do ${C.name}${ic('arrow')}</a>${alsoH}</section>`;
}

SWE.ready = fn => { const ok=()=>window.SW&&window.SW2&&window.SW_DATA&&window.SW_X&&window.SW_EST&&window.SW_MUN; if(ok()) return fn(); const t=setInterval(()=>{ if(ok()){ clearInterval(t); fn(); } },30); };
})();
