// Copiado do design da rodada 6 (design/rodada-6-demografia/codigo/molde-demografia.js) e ajustado para o site:
// usa o tema claro/escuro do site, sem cabeçalho próprio e sem o aviso de números de exemplo.
// Molde de Demografia, independente de país. Textos e níveis vêm de window.SW_DEMO; números de window.SW_DEMO_DATA.
(function(){
const SWD = window.SWD = {};
const C = () => window.SW_DEMO, D = () => window.SW_DEMO_DATA;
const num = (n,d=1) => n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
SWD.num = num;
SWD.int = n => n==null?'sem dado':Math.round(n).toLocaleString('pt-BR');
SWD.mi = (n,short) => n==null?'sem dado': n>=1e6? num(n/1e6,1)+(short?' mi':' milhões') : n>=1e4? num(n/1e3,1)+' mil' : SWD.int(n);
SWD.pct = (v,d=1) => v==null?'sem dado':num(v,d)+'%';
SWD.sgn = (v,d=1,suf='') => v==null?'sem dado':(v>0?'+':v<0?'−':'')+num(Math.abs(v),d)+suf;
SWD.ready = fn => { const ok=()=>window.SW&&window.SW2&&window.SW_DEMO&&window.SW_DEMO_DATA&&window.SW_GEO; ok()?fn():setTimeout(()=>SWD.ready(fn),30); };
SWD.q = new URLSearchParams(location.search||location.hash.slice(1));

/* ---------- lugares ---------- */
SWD.UFS = () => Object.keys(window.SW_DATA.UNITS);
SWD.name = l => l==='BR'?C().country.name : l.length===2? window.SW_DATA.UNITS[l][0] : ((window.SW_GEO_SP&&SW_GEO_SP.meta[l])?SW_GEO_SP.meta[l][0]:(D().names[l]||l).replace(/ - [A-Z]{2}$/,''));
SWD.region = l => l==='BR'?'' : l.length===2? window.SW_DATA.UNITS[l][1] : (window.SW_GEO_SP&&SW_GEO_SP.meta[l]?SW_GEO_SP.meta[l][1]:'');
SWD.munis = () => Object.keys(window.SW_GEO_SP.m);

/* ---------- selos e fontes ---------- */
const FQ = {censo:'Censo',anual:'Anual',est:'Estimativa',proj:'Projeção',mensal:'Mensal'};
SWD.freq = f => `<span class="freq ${f}" title="${f==='est'?'Estimativa, não é contagem':f==='proj'?'Projeção do IBGE, não é medição':'Frequência de atualização'}">${FQ[f]}</span>`;
SWD.stamp = (k,extra='') => { const s=C().SRC[k]; return `<div class="stamp">${SWD.freq(s.f)}<span>${s.s}${extra}<span class="lg-only"> · ${s.t} · ${C().consult}</span></span></div>`; };
SWD.srcLine = keys => `<b>Fonte:</b> ${keys.map(k=>{const s=C().SRC[k];return `${s.s} (${s.t})`}).join('; ')}. ${C().consult[0].toUpperCase()+C().consult.slice(1)}.`;
SWD.nodata = (t='Sem dado') => `<div class="nodata"><span class="sw-h" style="width:22px;height:14px"></span>${t}</div>`;
SWD.lvbox = (kind,html) => `<div class="lvbox"><span class="sw-h"></span><div><b>${({estado:'Só o número do estado',sem:'Sem dado neste nível',breve:'Em breve'})[kind]}</b>${html}</div></div>`;

/* ---------- navegação ---------- */
const themeQ = () => { const t=SWD.q.get('theme'); return t?`theme=${t}`:''; };
SWD.href = (lv,k,extra) => { const h=C().pages[lv][k]; if(!h) return null; const q=[extra,themeQ()].filter(Boolean).join('&'); return encodeURI(h)+(q?'?'+q:''); };
SWD.header = () => `<header class="top"><div class="wrap top-in">
 <a class="brand" href="${SWD.href('BR','geral')}"><span class="logo"><i></i><i></i><i></i><i></i></span>StatWorld</a>
 <nav aria-label="Temas">${['Economia','Saúde','Política','Demografia'].map(n=>n===C().topic?`<a class="on" aria-current="page" href="${SWD.href('BR','geral')}">${n}</a>`:`<a href="#">${n}</a>`).join('')}</nav>
 <button class="btn" id="themeBtn" type="button">Tema escuro</button></div></header>`;
SWD.tabbar = (active,lv) => `<nav class="tb" aria-label="Seções de ${C().topic}"><div class="tb-in">${C().TABS.map(G=>{
  const cur=G.items.some(i=>i.k===active);
  return `<div class="tb-g${cur?' cur':''}"><div class="tb-l">${G.g||'&nbsp;'}</div><div class="tb-r">${G.items.map(it=>{const s=it[lv], h=SWD.href(lv,it.k)||'#';
    if(it.k===active) return `<span class="on" aria-current="page">${it.n}</span>`;
    if(s==='breve') return `<span class="off" aria-disabled="true">${it.n}<em class="soon">em breve</em></span>`;
    return `<a href="${h}">${it.n}${s==='estado'?'<em class="lv" title="Só o número do estado">só estado</em>':''}</a>`}).join('')}</div></div>`}).join('')}</div></nav>`;
const applyFlag = () => { const s=C().sub.SP; document.documentElement.style.setProperty('--flag', s.flag[SW.theme()]||s.flag.light); };
// o: {active, lv:'BR'|'SUB', label, place?}
SWD.page = o => {
  const $=id=>document.getElementById(id), sub=C().sub.SP, CT=C().country; SWD.lv=o.lv;
  applyFlag(); SW.onTheme.push(applyFlag);
  if($('hdr')&&!C().noSite){ $('hdr').outerHTML=SWD.header(); $('themeBtn').onclick=SW.toggleTheme; SW.syncThemeBtn(); } // no site, o cabeçalho é o do site
  const tabLabel = o.active==='geral'?null:o.label;
  const parts=[[C().topic,SWD.href('BR','geral')],[CT.name,o.lv==='BR'&&!tabLabel?null:SWD.href('BR','geral')]];
  if(o.lv==='SUB') parts.push([sub.name, (tabLabel||o.place)?SWD.href('SUB','geral'):null]);
  if(tabLabel) parts.push([tabLabel,null]);
  if(o.place) parts.push([o.place,null]);
  $('crumb').innerHTML=parts.map(([n,h],i)=>(i?'<span aria-hidden="true">/</span>':'')+(h?`<a href="${h}">${n}</a>`:`<span>${n}</span>`)).join('');
  $('crumb').setAttribute('aria-label','Você está em');
  $('title').textContent = o.title || (o.lv==='SUB'?sub.title:CT.title);
  const st=$('subt'); if(st) st.textContent = o.sub || (o.lv==='SUB'?`Por ${sub.Unit.toLowerCase()}, ${SWD.munis().length} ${sub.units}`:`Por ${CT.Unit.toLowerCase()}, ${SWD.UFS().length} ${CT.units}`);
  if($('tabs')){ $('tabs').innerHTML=SWD.tabbar(o.active,o.lv); const tb=$('tabs').querySelector('.tb'), on=tb.querySelector('.on');
    if(on && tb.scrollWidth>tb.clientWidth) tb.scrollLeft=Math.max(0,on.getBoundingClientRect().left-tb.getBoundingClientRect().left-40); }
  const f=C().noSite?null:document.querySelector('footer.pg'); if(f) f.innerHTML='StatWorld · Os números do mundo, explicados. Dados abertos de fontes oficiais; cada número traz fonte, data e selo de frequência.';
  if(!C().noSite) document.title = `${o.place||o.label||'Visão geral'} · ${C().topic} · StatWorld`;
};
SWD.seg = (el,opts,cur,on,label) => { el.setAttribute('role','tablist'); if(label) el.setAttribute('aria-label',label);
  const paint=c=>el.innerHTML=opts.map(([k,n,sm])=>`<button type="button" role="tab" data-k="${k}" class="${k===c?'on':''}" aria-selected="${k===c}">${sm?`<span class="lg-only">${n}</span><span class="sm-only">${sm}</span>`:n}</button>`).join('');
  paint(cur); el.onclick=e=>{const b=e.target.closest('button'); if(b){paint(b.dataset.k); on(b.dataset.k)}}; };

/* ---------- classificação e legendas ---------- */
SWD.cls = (v,cuts) => { let i=0; while(i<cuts.length && v>=cuts[i]) i++; return i; };
SWD.GROW = {cuts:[-1,-0.5,0,1,2], legend:['−1% ou menos','−1 a −0,5%','−0,5 a 0%','0 a 1%','1 a 2%','2% ou mais'], short:['≤ −1','−1','−0,5','0','1','≥ 2']};
SWD.legend = (labels,v='r',nulls=0,unit) => `<div class="legend"><div class="ramp">${labels.map((l,i)=>`<div><i style="background:var(--${v}${i})"></i>${l}</div>`).join('')}</div>
 ${nulls?`<div class="lg-h"><i></i>Sem dado (${nulls} ${unit||'lugares'})</div>`:''}</div>`;
SWD.divLegend = () => `<div class="legend"><div style="display:grid;gap:8px;width:100%;max-width:540px"><div style="display:flex;justify-content:space-between;font-size:13px;color:var(--sub)"><span>◀ Encolheu</span><span>Cresceu ▶</span></div>
 <div class="ramp">${SWD.GROW.legend.map((l,i)=>`<div><i style="background:var(--d${i})"></i><span class="lg-only">${l}</span><span class="sm-only">${SWD.GROW.short[i]}</span></div>`).join('')}</div><div style="font-size:12px;color:var(--faint)">Taxa média de crescimento ao ano, 2010 a 2022</div></div></div>`;

/* ---------- pirâmide ---------- */
SWD.share = a => { const t=a[0].concat(a[1]).reduce((s,v)=>s+v,0); return [a[0].map(v=>v/t*100),a[1].map(v=>v/t*100)]; };
SWD.ageStats = a => { const t=a[0].map((m,i)=>m+a[1][i]), T=t.reduce((s,v)=>s+v,0); let c=0,med=null;
  for(let i=0;i<t.length;i++){ if(c+t[i]>=T/2){med=i*5+5*(T/2-c)/t[i];break} c+=t[i]; }
  const kids=t[0]+t[1]+t[2], old=t[13]+t[14]+t[15]+t[16];
  return {med, envel:old/kids*100, kids:kids/T*100, old:old/T*100, total:T}; };
// o:{a:[m,f], cmp:[m,f]|null, proj, W,H, max, aria, cmpLabel}
SWD.pyramid = (el,o) => {
  const AG=C().AGES, n=AG.length, W=o.W||640, H=o.H||520, mid=W/2, gap=48, T=36, B=28, side=mid-gap/2-8;
  const a=SWD.share(o.a), c=o.cmp?SWD.share(o.cmp):null, max=o.max||6;
  const bh=(H-T-B)/n, y=i=>T+(n-1-i)*bh, w=v=>Math.min(v,max)/max*side;
  let g=`<text class="sx" x="${mid-gap/2-side}" y="18">Homens</text><text class="sx" x="${mid+gap/2+side}" y="18" text-anchor="end">Mulheres</text>`;
  const ticks=[0,max/2,max]; ticks.forEach(t=>{ [mid-gap/2-w(t),mid+gap/2+w(t)].forEach(x=>g+=`<line class="gl" x1="${x}" x2="${x}" y1="${T-4}" y2="${H-B}"/><text x="${x}" y="${H-8}" text-anchor="middle">${num(t,t%1?1:0)}%</text>`); });
  for(let i=0;i<n;i++){ const Y=y(i)+1, h=bh-2;
    g+=`<rect class="m" x="${mid-gap/2-w(a[0][i])}" y="${Y}" width="${w(a[0][i])}" height="${h}"><title>${AG[i]} anos, homens: ${num(a[0][i],1)}%</title></rect>`;
    g+=`<rect class="f" x="${mid+gap/2}" y="${Y}" width="${w(a[1][i])}" height="${h}"><title>${AG[i]} anos, mulheres: ${num(a[1][i],1)}%</title></rect>`;
    if(i%2===0||W>520) g+=`<text class="age" x="${mid}" y="${Y+h/2+4}" text-anchor="middle">${AG[i]}</text>`; }
  if(c){ const step=(s,sign)=>{ let d=''; for(let i=0;i<n;i++){ const x=sign<0?mid-gap/2-w(c[s][i]):mid+gap/2+w(c[s][i]); d+=(i?'L':'M')+x.toFixed(1)+' '+(y(i)+bh).toFixed(1)+'L'+x.toFixed(1)+' '+y(i).toFixed(1);} return d; };
    g+=`<path class="cmp" d="${step(0,-1)}"/><path class="cmp" d="${step(1,1)}"/>`; }
  const tbl=`<table class="sr"><caption>${o.aria||'Pirâmide etária'}, % da população</caption><tr><th>Idade</th><th>Homens</th><th>Mulheres</th>${c?`<th>Homens, ${o.cmpLabel}</th><th>Mulheres, ${o.cmpLabel}</th>`:''}</tr>${AG.map((l,i)=>`<tr><td>${l}</td><td>${num(a[0][i],1)}%</td><td>${num(a[1][i],1)}%</td>${c?`<td>${num(c[0][i],1)}%</td><td>${num(c[1][i],1)}%</td>`:''}</tr>`).join('')}</table>`;
  el.innerHTML=`<svg class="pyr${o.proj?' proj':''}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>${tbl}`;
};

/* ---------- linhas (várias séries) ---------- */
// o:{series:[{name,pts:[[x,v]],cls,dash}], W,H, fmt, xs:[ticks], aria}
SWD.lines = (el,o) => {
  const W=o.W||900,H=o.H||360,L=8,R=o.R||140,T=16,B=30, all=o.series.flatMap(s=>s.pts);
  const x0=Math.min(...all.map(p=>p[0])), x1=Math.max(...all.map(p=>p[0]));
  let hi=Math.max(...all.map(p=>p[1])); const p10=Math.pow(10,Math.floor(Math.log10(hi))), stp=[1,2,2.5,5,10].map(f=>f*p10/2).find(s=>hi/s<=5)||p10; hi=Math.ceil(hi/stp)*stp;
  const x=v=>L+(v-x0)/(x1-x0)*(W-L-R), y=v=>T+(hi-v)/hi*(H-T-B), f=o.fmt||(v=>SWD.mi(v,true));
  let g=''; for(let v=0; v<=hi+1e-9; v+=stp) g+=`<line class="${v===0?'ax':'gl'}" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L}" y="${y(v)-5}">${f(v)}</text>`;
  (o.xs||[x0,x1]).forEach(v=>g+=`<text x="${x(v)}" y="${H-8}" text-anchor="middle">${v}</text>`);
  o.series.forEach(s=>{ const d='M'+s.pts.map(p=>x(p[0]).toFixed(1)+' '+y(p[1]).toFixed(1)).join('L'), l=s.pts[s.pts.length-1];
    g+=`<path d="${d}" style="fill:none;stroke:${s.c};stroke-width:2.2;${s.dash?'stroke-dasharray:5 4':''}"/>${s.dots?s.pts.map(p=>`<circle cx="${x(p[0])}" cy="${y(p[1])}" r="3" style="fill:${s.c}"/>`).join(''):''}
    ${s.nolabel?'':`<text x="${x(l[0])+10}" y="${y(l[1])+4}" style="fill:var(--ink);font-size:13px;font-weight:600">${s.name}</text><text x="${x(l[0])+10}" y="${y(l[1])+20}" style="font-size:12px">${f(l[1])}</text>`}`; });
  const tbl=`<table class="sr"><caption>${o.aria}</caption><tr><th>Ano</th>${o.series.map(s=>`<th>${s.name}</th>`).join('')}</tr>${o.series[0].pts.map((p,i)=>`<tr><td>${p[0]}</td>${o.series.map(s=>`<td>${s.pts[i]?SWD.int(s.pts[i][1]):''}</td>`).join('')}</tr>`).join('')}</table>`;
  el.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>${tbl}`;
};

/* ---------- cada 100 ---------- */
SWD.per100 = vals => { const t=vals.reduce((s,v)=>s+(v||0),0), raw=vals.map(v=>(v||0)/t*100), fl=raw.map(Math.floor); let rest=100-fl.reduce((s,v)=>s+v,0);
  raw.map((v,i)=>[v-fl[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,rest).forEach(([,i])=>fl[i]++); return {n:fl,p:raw}; };
// cats:[{k,n,v,c}]
SWD.cada100 = (el,cats,o={}) => { const r=SWD.per100(cats.map(c=>c.v)); let sq='';
  cats.forEach((c,i)=>{for(let k=0;k<r.n[i];k++) sq+=`<i data-k="${c.k}" style="background:${c.c}"></i>`});
  el.innerHTML=`<div class="w100" style="grid-template-columns:minmax(0,1fr);margin:0"><div class="wcol">
   ${o.title?`<div class="wh"><h3>${o.title}</h3><span>${o.note||'um quadrado = 1 pessoa'}</span></div>`:''}
   <div class="wf" role="img" aria-label="${o.aria||'Cada 100 pessoas'}: ${cats.map((c,i)=>`${c.n} ${r.n[i]}`).join(', ')}">${sq}</div>
   <ul class="wl">${cats.map((c,i)=>`<li data-k="${c.k}"><i style="background:${c.c}"></i><span>${c.n}</span><b>${r.n[i]===0&&r.p[i]>0?'menos de 1':r.n[i]} <span style="font-weight:400;color:var(--faint);font-size:13px">· ${num(r.p[i],1)}%</span></b></li>`).join('')}</ul></div></div>`;
  SW2.bindWaffle(el); };

/* ---------- número ao vivo (estimativa) ---------- */
SWD.live = (el,loc) => { const d=D(), base=d.est[loc]; if(base==null){ el.innerHTML=SWD.nodata(); return; }
  const y0=+d.estYear, t0=new Date(y0,6,1).getTime(), rc=d.rc, nat=(rc.nasc[loc]&&rc.obit[loc])?(rc.nasc[loc]['2024']-rc.obit[loc]['2024']):0, perMs=nat/(365.25*864e5);
  const val=()=>base+perMs*(Date.now()-t0);
  el.innerHTML=`<div class="livepop"><div class="stamp">${SWD.freq('est')}<span>agora, segundo a segundo</span></div>
   <div class="n" aria-hidden="true"></div><div class="sr">Cerca de ${SWD.mi(val())} de pessoas, estimativa</div>
   <div class="l"><span class="lg-only">Não é contagem. Parte da estimativa do IBGE para 1º de julho de ${y0} e soma os nascimentos menos as mortes registrados em 2024, distribuídos por segundo.</span><span class="sm-only">Estimativa, não é contagem.</span></div></div>`;
  const n=el.querySelector('.n'); const tick=()=>{ if(!n.isConnected) return clearInterval(tm); n.textContent=SWD.int(val()); };
  const tm=setInterval(tick,1000); tick(); };

/* ---------- mapa de municípios ---------- */
let mseq=0;
SWD.MuniMap = class {
  constructor(el,o={}){ const G=window.SW_GEO_SP; this.o=o; this.id='mh'+(++mseq); this.ids=Object.keys(G.m);
    el.innerHTML=`<svg class="map mm" viewBox="0 0 ${G.w} ${G.h}" role="img" aria-label="${o.aria||'Mapa por município'}">
     <defs><pattern id="${this.id}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" style="fill:var(--bg)"/><line x1="0" y1="0" x2="0" y2="4" style="stroke:var(--hatch);stroke-width:1"/></pattern></defs>
     <g>${this.ids.map(m=>`<path class="mu" data-m="${m}" d="${G.m[m].d}"><title>${SWD.name(m)}</title></path>`).join('')}</g>
     <path class="mhov" d=""/><path class="msel" d=""/><text class="pin"></text></svg>`;
    this.svg=el.querySelector('svg'); this.p={}; this.svg.querySelectorAll('.mu').forEach(p=>this.p[p.dataset.m]=p);
    const hit=e=>{const t=e.target.closest('[data-m]'); return t&&t.dataset.m;};
    this.svg.addEventListener('mouseover',e=>{const m=hit(e); if(m) o.onHover&&o.onHover(m);});
    this.svg.addEventListener('mouseleave',()=>o.onHover&&o.onHover(null));
    this.svg.addEventListener('click',e=>{const m=hit(e); if(m) o.onClick&&o.onClick(m);}); }
  update(fill,keep){ for(const m of this.ids){ const r=fill(m), p=this.p[m]; p.style.fill=r.hatch?`url(#${this.id})`:r.f; p.classList.toggle('out',!!(keep&&!keep(m))); } }
  mark(sel,hov){ const G=window.SW_GEO_SP; this.svg.querySelector('.msel').setAttribute('d',sel?G.m[sel].d:''); this.svg.querySelector('.mhov').setAttribute('d',hov&&hov!==sel?G.m[hov].d:'');
    const t=this.svg.querySelector('.pin'), s=hov||sel; if(s){ const [x,y]=G.m[s].c; t.setAttribute('x',Math.min(G.w-150,x+10)); t.setAttribute('y',y-10); t.textContent=SWD.name(s);} else t.textContent=''; }
};

/* ---------- lista longa com busca (municípios) ---------- */
// o:{rows:[{id,v,txt}], sel, hov, col, head, filter:id=>bool, onClick, onHover}
SWD.LongRank = class {
  constructor(el,o){ this.el=el; this.o=o; this.all=false;
    el.addEventListener('click',e=>{ if(e.target.closest('.more')){ this.all=!this.all; this.render(this.st); } });
    el.addEventListener('mouseover',e=>{const li=e.target.closest('li[data-m]'); if(li) o.onHover(li.dataset.m);});
    el.addEventListener('mouseleave',()=>o.onHover(null));
    el.addEventListener('click',e=>{const li=e.target.closest('li[data-m]'); if(li) o.onClick(li.dataset.m);});
    el.addEventListener('keydown',e=>{ if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return; e.preventDefault(); const ord=this.order; let i=ord.indexOf(this.st.sel);
      i=e.key==='Home'?0:e.key==='End'?ord.length-1:Math.max(0,Math.min(ord.length-1,i+(e.key==='ArrowDown'?1:-1))); o.onClick(ord[i]);
      requestAnimationFrame(()=>{const li=el.querySelector(`li[data-m="${ord[i]}"]`); if(li){li.focus(); const ul=li.parentNode; if(li.offsetTop<ul.scrollTop||li.offsetTop>ul.scrollTop+ul.clientHeight-40) ul.scrollTop=li.offsetTop-ul.clientHeight/2;}}); }); }
  render(st){ this.st=st; const all=st.rows.filter(r=>r.v!=null).sort((a,b)=>b.v-a.v), rank=new Map(all.map((r,i)=>[r.id,i+1]));
    const nul=st.rows.filter(r=>r.v==null), vis0=[...all,...nul].filter(r=>!st.filter||st.filter(r.id)); this.order=vis0.map(r=>r.id);
    const N=40, si=vis0.findIndex(r=>r.id===st.sel); let vis=this.all?vis0:vis0.slice(0,N); const tail=!this.all&&si>=N;
    const max=Math.max(...all.map(r=>Math.abs(r.v)),1e-9);
    const ul=this.el.querySelector('ul'), sc=ul?ul.scrollTop:0;
    this.el.innerHTML=`<div class="rk-h"><span>${st.head}</span><span>${st.col}</span></div>
     <ul class="rk long" role="listbox" aria-label="Ranking, ${vis0.length} de ${st.rows.length}">${vis.length?(tail?vis.concat([null,vis0[si]]):vis).map(r=>{ if(!r) return '<li class="gap" aria-hidden="true">···</li>'; const nd=r.v==null;
      return `<li data-m="${r.id}" role="option" tabindex="${r.id===st.sel?0:-1}" aria-selected="${r.id===st.sel}" class="${r.id===st.sel?'on':''} ${r.id===st.hov?'hv':''}"><span class="n">${nd?'—':rank.get(r.id)}</span><span class="nm">${SWD.name(r.id)}</span><span class="bar ${nd?'h':''}">${nd?'':`<i style="width:${Math.max(2,Math.abs(r.v)/max*100)}%;${r.id===st.sel?'background:var(--flag)':''}"></i>`}</span><span class="v ${nd?'nd':''}">${nd?'sem dado':r.txt}</span></li>`}).join(''):`<li class="gap" style="height:44px">Nenhum ${st.head.toLowerCase()} encontrado</li>`}</ul>
     <div class="rk-more">${vis0.length>N?`<button class="more" type="button" aria-expanded="${this.all}">${this.all?`Mostrar só os ${N} primeiros`:`Ver todos os ${vis0.length}`}</button>`:`<span style="color:var(--sub);font-size:14px">${vis0.length} de ${st.rows.length}</span>`}<span>${nul.length?`${nul.length} sem dado`:''}</span></div>`;
    this.el.querySelector('ul').scrollTop=sc; }
};
SWD.searchBox = (el,ph,on) => { el.innerHTML=`<label class="search"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><span class="sr">Buscar</span><input type="search" placeholder="${ph}" autocomplete="off"></label>`;
  el.querySelector('input').oninput=e=>on(e.target.value); };
SWD.norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
})();
