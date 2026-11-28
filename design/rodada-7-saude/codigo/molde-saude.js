// Molde do tema Saúde. Tudo vem de window.SW_CFG (textos, abas, níveis, cores) e das malhas SW_GEO / SW_GEO_MUN.
// Números exibidos são sempre de exemplo ("00,0"). Cores, comprimentos e ordens são ilustrativos e calculados aqui só para dar forma.
(function(){
const H = window.SWH = {};
const Q = new URLSearchParams(location.search||location.hash.slice(1));
const S = {p:Q.get('p')||'geral', lv:Q.get('lv')||'BR', v:Q.get('v')||'', u:Q.get('u')||'', d:Q.get('d')||'', m:Q.get('m')||''};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MOB = () => document.documentElement.clientWidth<=640;
const t2 = (l,s) => MOB()&&s?s:l;
const hsh = s => { let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} h^=h>>>13; h=Math.imul(h,1274126177); return ((h^(h>>>16))>>>0)/4294967296; };
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const ARW = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const OUT = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="font-size:.85em"><path d="M8 16 16 8M10 8h6v6"/></svg>';
let C, L;

/* ---------- selos e carimbos ---------- */
const FQ = {censo:'Censo',anual:'Anual',mensal:'Mensal',semanal:'Semanal',estimativa:'Estimativa',projecao:'Projeção',aovivo:'Ao vivo'};
const ex = () => `<span class="ex" title="Número de exemplo, ainda não é dado oficial">Exemplo</span>`;
const fq = f => `<span class="freq${f==='aovivo'?' live':''}" title="Frequência de atualização">${FQ[f]}</span>`;
const prel = () => `<span class="freq prel" title="O período mais recente ainda recebe registros e pode mudar">Preliminar</span>`;
const stamp = (src,ref,f,o={}) => `<div class="stamp">${o.ex===false?'':ex()}${fq(f)}${o.est?fq('estimativa'):''}${o.prel?prel():''}<span>${esc(C.src[src]||src)}${ref?' '+ref:''} · ${C.date}</span></div>`;
const mstamp = (m,o={}) => stamp(m.src,m.ref,m.f,Object.assign({prel:m.prel},o));
const note = html => `<p class="mnote"><em class="i" aria-hidden="true">i</em><span>${html}</span></p>`;
H.stamp = stamp;

/* ---------- valores ilustrativos (forma, nunca número) ---------- */
const ill = (id,key) => { const u=L.units[id]; if(!u||!u.c) return .25+.5*hsh(id+key);
  const [x,y]=u.c, s=hsh(key)*6.28, k=L.key==='BR'?1:.8;
  const v=.5+.22*Math.sin(x/(160*k)+s)+.18*Math.cos(y/(140*k)+s*1.7)+(hsh(id+key)-.5)*.34; return Math.max(0,Math.min(.999,v)); };
const cls = v => Math.min(5,Math.floor(v*6));
const isNd = (id,key) => hsh('nd'+id+key) < (L.key==='BR'?.035:.012);
const jit = (k,a=.3) => 1-a/2+a*hsh(k);

/* ---------- nível: país por estado ou estado por município ---------- */
function mkLevel(){
  const sb = C.sub[S.lv];
  if(!sb){ const U=SW_DATA.UNITS, G=SW_GEO.states, units={};
    Object.keys(U).sort((a,b)=>U[a][0].localeCompare(U[b][0],'pt')).forEach(k=>units[k]={n:U[k][0],r:U[k][1],c:G[k].c});
    return {key:'BR',units,ids:Object.keys(units),regions:C.country.regions,regionLabel:C.country.regionLabel,Unit:C.country.Unit,unit:C.country.unit,units_:C.country.units,name:C.country.name,title:C.country.title,ramp:'r',parent:null,def:C.country.def,flag:()=>''}; }
  const G=SW_GEO_MUN, units={};
  Object.keys(G.units).sort((a,b)=>G.units[a].n.localeCompare(G.units[b].n,'pt')).forEach(k=>units[k]=G.units[k]);
  return {key:sb.key,sb,units,ids:Object.keys(units),regions:G.regions,regionLabel:sb.regionLabel,Unit:sb.Unit,unit:sb.unit,units_:sb.units,name:sb.name,title:sb.title,ramp:'g',parent:C.country.name,def:sb.def,
    flag:(id,m)=>{ const u=units[id]; if(!u||!m) return ''; const p=u.p||0; if(m.rare) return p<C.small.rare?'few':''; if(m.avg3){ if(p<C.small.few) return 'few'; if(p<C.small.avg3) return 'avg'; } return ''; }};
}
const pname = id => id==='__p'?L.name:(L.units[id]?L.units[id].n:id);
// lugares comparados: o escolhido, o estado (no nível municipal) e o país
const cmpOf = id => { const a=[]; if(id!=='__p') a.push({k:id,n:pname(id),c:L.key==='BR'?'pt':'pt f'}); if(L.parent) a.push({k:'__p',n:L.name,c:'rg'}); a.push({k:'__BR',n:C.country.name,c:'tk'}); return a; };
const cmpLegend = list => `<div class="lgd">${list.map(p=>`<span><i class="${p.c}"></i>${esc(p.n)}</span>`).join('')}</div>`;

/* ---------- endereços ---------- */
const href = (k,o={}) => { if(C.links[k]) return C.links[k]; const p=new URLSearchParams(); p.set('p',k); const lv=o.lv||S.lv; if(lv!=='BR') p.set('lv',lv);
  if(o.u) p.set('u',o.u); if(o.v) p.set('v',o.v); if(Q.get('theme')) p.set('theme',Q.get('theme')); return encodeURI(C.file)+'?'+p.toString(); };

/* ---------- mapas ---------- */
class BRMap{ constructor(el,o){ this.m=new SW.Map(el,{aria:o.aria,onHover:o.onHover,onClick:o.onClick}); }
  update(fill){ this.m.update({fill:u=>{const r=fill(u); return r.nd?{hatch:true}:{f:`var(--r${r.k})`,k:r.k};}}); }
  mark(s,h){ this.m.mark(s,h); } }
let mseq=0;
class MunMap{
  constructor(el,o){ const G=SW_GEO_MUN, id='mm'+(++mseq); this.id=id; this.o=o;
    el.innerHTML=`<svg class="map mun" viewBox="-4 -4 ${G.w+8} ${G.h+8}" role="img" aria-label="${esc(o.aria||'Mapa por município')}"><defs>
      <pattern id="${id}h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" style="fill:var(--bg)"/><line x1="0" y1="0" x2="0" y2="4" style="stroke:var(--hatch);stroke-width:1.1"/></pattern>
      <pattern id="${id}d" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" style="fill:var(--bg)"/><circle cx="2" cy="2" r=".85" style="fill:var(--sub)"/></pattern></defs>
      <g class="g-m">${L.ids.map(k=>`<path data-u="${k}" d="${G.units[k].d}"><title>${esc(G.units[k].n)}</title></path>`).join('')}</g>
      <path class="hov" d=""/><path class="sel" d=""/><g class="g-lab"></g></svg>`;
    this.svg=el.querySelector('svg'); this.p={}; this.svg.querySelectorAll('[data-u]').forEach(p=>this.p[p.dataset.u]=p);
    if(o.static){ this.svg.style.pointerEvents='none'; return; }
    const hit=e=>{const t=e.target.closest('[data-u]'); return t&&t.dataset.u;};
    this.svg.addEventListener('mouseover',e=>{const u=hit(e); if(u) o.onHover&&o.onHover(u);});
    this.svg.addEventListener('mouseleave',()=>o.onHover&&o.onHover(null));
    this.svg.addEventListener('click',e=>{const u=hit(e); if(u) o.onClick&&o.onClick(u);});
  }
  update(fill){ for(const k in this.p){ const r=fill(k); this.p[k].style.fill = r.nd?`url(#${this.id}h)`: r.few?`url(#${this.id}d)`: `var(--g${r.k})`; } }
  mark(sel,hov){ const G=SW_GEO_MUN.units; this.svg.querySelector('.sel').setAttribute('d',sel?G[sel].d:''); this.svg.querySelector('.hov').setAttribute('d',hov&&hov!==sel?G[hov].d:'');
    const show=hov||sel, g=this.svg.querySelector('.g-lab'); if(!show||this.o.nolabel){ g.innerHTML=''; return; }
    const [x,y]=G[show].c, W=SW_GEO_MUN.w, right=x>W*.72; g.innerHTML=`<text class="lab out" x="${right?x-10:x+10}" y="${y+4}" text-anchor="${right?'end':'start'}" style="font-size:${MOB()?22:14}px">${esc(G[show].n)}</text>`; }
}
const mkMap = (el,o) => L.key==='BR'? new BRMap(el,o) : new MunMap(el,o);

const legend = (m,{nd=0,few=0}={}) => { const sp=m.ph.replace('R$ ','').replace('%',''), labs=[`até ${m.ph}`,`${sp}–${sp}`,`${sp}–${sp}`,`${sp}–${sp}`,`${sp}–${sp}`,`${sp} ou mais`];
  return `<div class="legend"><div class="ramp">${labs.map((l,i)=>`<div><i style="background:var(--${L.ramp}${i})"></i>${l}</div>`).join('')}</div>
  ${few?`<div class="lg-h lg-d"><i></i>Poucos casos (${few})</div>`:''}${nd?`<div class="lg-h"><i></i>Sem dado (${nd})</div>`:''}</div>
  <div class="exnote">${ex()}<span>${t2('Cores, barras e ordem são ilustrativas: mostram a forma da tela, não o dado.','Cores e ordem ilustrativas.')}</span></div>`; };

/* ---------- ranking com busca e filtro por região ---------- */
class Rank{
  constructor(el,o){ this.el=el; this.o=o; this.exp=false; this.q=''; this.rg='';
    el.innerHTML=`<div class="rk-tools"><label class="fld"><span class="sr">Buscar ${L.unit}</span><input type="search" placeholder="Buscar ${L.unit}" autocomplete="off"></label>
      <label class="fld"><span class="sr">${L.regionLabel}</span><select><option value="">${L.key==='BR'?'Todas as regiões':'Todas as regiões'}</option>${L.regions.map(r=>`<option>${esc(r)}</option>`).join('')}</select></label></div><div class="rk-b"></div>`;
    this.b=el.querySelector('.rk-b');
    el.querySelector('input').addEventListener('input',e=>{this.q=norm(e.target.value.trim()); this.render(this.last);});
    el.querySelector('select').addEventListener('change',e=>{this.rg=e.target.value; this.render(this.last);});
    this.b.addEventListener('mouseover',e=>{const li=e.target.closest('li[data-u]'); if(li) o.onHover(li.dataset.u);});
    this.b.addEventListener('mouseleave',()=>o.onHover(null));
    this.b.addEventListener('click',e=>{ if(e.target.closest('.more')){ this.exp=!this.exp; this.render(this.last); return; } const li=e.target.closest('li[data-u]'); if(li) o.onClick(li.dataset.u); });
    this.b.addEventListener('keydown',e=>{ if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return; e.preventDefault();
      const ord=[...this.b.querySelectorAll('li[data-u]')].map(li=>li.dataset.u); let i=ord.indexOf(this.last.sel);
      i=e.key==='Home'?0:e.key==='End'?ord.length-1:Math.max(0,Math.min(ord.length-1,i+(e.key==='ArrowDown'?1:-1)));
      o.onClick(ord[i]); requestAnimationFrame(()=>{const li=this.b.querySelector(`li[data-u="${ord[i]}"]`); li&&li.focus();}); });
  }
  render(st){ this.last=st; const n=8, nm=id=>L.units[id].n, byN=(a,b)=>nm(a.id).localeCompare(nm(b.id),'pt');
    const val=st.rows.filter(r=>!r.nd&&!r.few).sort((a,b)=>b.v-a.v); val.forEach((r,i)=>r.rank=i+1);
    const few=st.rows.filter(r=>r.few&&!r.nd).sort(byN), nd=st.rows.filter(r=>r.nd).sort(byN);
    const ok=r=>(!this.q||norm(nm(r.id)).includes(this.q))&&(!this.rg||L.units[r.id].r===this.rg), filt=!!(this.q||this.rg);
    const max=val.length?val[0].v:1;
    const row=r=>`<li data-u="${r.id}" role="option" tabindex="${r.id===st.sel?0:-1}" aria-selected="${r.id===st.sel}" class="${r.id===st.sel?'on':''} ${r.id===st.hov?'hv':''} ${r.few?'small':''}">
      <span class="n">${r.rank||'—'}</span><span class="nm">${esc(nm(r.id))}</span>
      <span class="bar ${r.nd?'h':''}">${r.nd||r.few?'':st.ci?`<span class="trk" style="height:8px"><span class="ci" style="left:${(r.v*.75-.08)*100}%;width:${(.12+hsh(r.id+'ci')*.18)*100}%;height:6px;margin-top:-3px"></span><span class="pt" style="left:${r.v*75}%;width:8px;height:8px;margin:-4px 0 0 -4px;box-shadow:none"></span></span>`:`<i style="width:${Math.max(3,r.v/max*100)}%"></i>`}</span>
      <span class="v ${r.nd||r.few?'nd':''}">${r.nd?'sem dado':r.few?'poucos casos':r.txt+(r.avg?'<sup title="Média de 3 anos">†</sup>':'')}</span></li>`;
    const grp=(t,i)=>`<li class="grp" aria-hidden="true">${i}${t}</li>`;
    let html='';
    if(filt||this.exp){ const a=val.filter(ok), b=few.filter(ok), c=nd.filter(ok);
      html=a.map(row).join('')+(b.length?grp(`Poucos casos para comparar · ${b.length}`,'<i class="sw-h dots" style="background-color:transparent"></i>')+b.map(row).join(''):'')+(c.length?grp(`Sem dado · ${c.length}`,'<i class="sw-h"></i>')+c.map(row).join(''):'');
      if(!a.length&&!b.length&&!c.length) html=`<li class="empty">Nenhum ${L.unit} encontrado.</li>`; }
    else { html=val.slice(0,n).map(row).join(''); const all=[...val,...few,...nd], s=all.find(r=>r.id===st.sel);
      if(s&&!(s.rank&&s.rank<=n)) html+=`<li class="gap" aria-hidden="true">···</li>`+row(s); }
    const avg=st.rows.some(r=>r.avg);
    this.b.innerHTML=`<div class="rk-h"><span>${L.Unit}</span><span>${st.col}</span></div>
      <div class="${(this.exp||filt)&&st.rows.length>14?'rk-scroll':''}"><ul class="rk" role="listbox" aria-label="${L.units_} por ${esc(st.col)}">${html}</ul></div>
      <div class="rk-more">${filt?`<span>${[val,few,nd].flat().filter(ok).length} de ${st.rows.length} ${L.units_}</span>`:`<button class="more" type="button" aria-expanded="${this.exp}">${this.exp?`Mostrar só os ${n} primeiros`:`Ver todos os ${st.rows.length} ${L.units_}`}</button>`}<span>${[few.length?`${few.length} com poucos casos`:'',nd.length?`${nd.length} sem dado`:''].filter(Boolean).join(' · ')}</span></div>
      ${avg?`<p class="srcnote" style="margin-top:8px">† Média de 3 anos: ${L.units_} com menos de ${SW.num(C.small.avg3,0).replace(',','.')} habitantes.</p>`:''}`;
  }
}

/* ---------- gráficos ---------- */
const CH=[]; const reg=(el,f)=>{ el._r=f; if(!CH.includes(el)) CH.push(el); f(); };
H.reflow=()=>CH.forEach(el=>el.isConnected&&el._r());
// linha: {n, series:[{n,vals,main}], xl(i), ticks:[i], bands:[{a,b,label}], prel, h, mini, aria, yl, tipx(i)}
function line(el,o){ reg(el,()=>{
  const W=Math.max(240,Math.round(el.clientWidth||600)), Hh=o.h||(MOB()?200:280), L0=2, R=o.mini?26:40, T=o.bands&&!o.mini?26:8, B=22, n=o.n;
  const hi=Math.max(...o.series.flatMap(s=>s.vals.filter(v=>v!=null)))*1.12||1;
  const x=i=>L0+i/(n-1)*(W-L0-R), y=v=>T+(1-v/hi)*(Hh-T-B), st=(W-L0-R)/(n-1);
  let g=''; const gl=o.mini?2:4;
  for(let j=0;j<=gl;j++){ const v=hi*j/gl; g+=`<line class="${j?'gl':'ax'}" x1="${L0}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${W-R+6}" y="${(y(v)+4).toFixed(1)}">${j?(o.yl||'00'):'0'}</text>`; }
  (o.bands||[]).forEach(b=>{ g+=`<rect class="bnd" x="${(x(b.a)-st/2).toFixed(1)}" y="${T}" width="${((b.b-b.a+1)*st).toFixed(1)}" height="${Hh-T-B}"/>`+(o.mini?'':`<text class="bndt" x="${(x(b.a)-st/2).toFixed(1)}" y="${T-8}">${b.label}</text>`); });
  const tk=o.ticks||[0,Math.round((n-1)/2),n-1];
  tk.forEach((i,k)=>g+=`<text x="${x(i).toFixed(1)}" y="${Hh-5}" text-anchor="${k===0?'start':k===tk.length-1?'end':'middle'}">${o.xl(i)}</text>`);
  const pk=n-1-(o.prel||0), path=(v,a,b)=>{let d='',m=true; for(let i=a;i<=b;i++){ if(v[i]==null){m=true;continue;} d+=(m?'M':'L')+x(i).toFixed(1)+' '+y(v[i]).toFixed(1); m=false;} return d;};
  o.series.slice().reverse().forEach(s=>{ const c=s.main?'ln':'ln2'; g+=`<path class="${c}" d="${path(s.vals,0,pk)}"/>`; if(o.prel) g+=`<path class="${c} lnd" d="${path(s.vals,pk,n-1)}"/>`; });
  const m=o.series.find(s=>s.main); if(m&&m.vals[n-1]!=null) g+=`<circle cx="${x(n-1)}" cy="${y(m.vals[n-1])}" r="${o.mini?3:4}" style="fill:var(--accent)"/>`;
  const tw=o.series.length>1?200:150, th=22+18*o.series.length;
  el.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="${esc(o.aria||'Série')}">${g}
    <g class="hv" style="display:none;pointer-events:none"><line class="xh" y1="${T}" y2="${Hh-B}"/><g class="tip"><rect rx="4" width="${tw}" height="${th}"/>${['',...o.series].map((s,i)=>`<text x="10" y="${18+18*i}" ${i?'':'style="font-weight:600"'}></text>`).join('')}</g></g>
    <rect class="hit" width="${W}" height="${Hh}" fill="transparent"/></svg>`;
  const svg=el.querySelector('svg'), hv=svg.querySelector('.hv'), tx=hv.querySelectorAll('text');
  svg.querySelector('.hit').onmousemove=e=>{ const r=svg.getBoundingClientRect(), i=Math.max(0,Math.min(n-1,Math.round(((e.clientX-r.left)/r.width*W-L0)/st))); hv.style.display='';
    const X0=x(i), l=hv.querySelector('line'); l.setAttribute('x1',X0); l.setAttribute('x2',X0);
    hv.querySelector('.tip').setAttribute('transform',`translate(${X0>W-tw-30?X0-tw-10:X0+10},${T})`);
    tx[0].textContent=(o.tipx||o.xl)(i)+(i>pk?' · preliminar':''); o.series.forEach((s,k)=>tx[k+1].textContent=(o.series.length>1?s.n+': ':'')+(s.vals[i]==null?'sem dado':(o.yv||'00,0'))); };
  svg.querySelector('.hit').onmouseleave=()=>hv.style.display='none';
});}
// colunas: {n, vals, band:[[lo,hi]], med, prel, xl, ticks, tipx, aria, h}
function cols(el,o){ reg(el,()=>{
  const W=Math.max(240,Math.round(el.clientWidth||600)), Hh=o.h||(MOB()?220:300), L0=2, R=40, T=8, B=22, n=o.n, id='pc'+(++mseq);
  const hi=Math.max(...o.vals.filter(v=>v!=null),...(o.band||[]).map(b=>b[1]))*1.12||1, bw=(W-L0-R)/n, x=i=>L0+i*bw, y=v=>T+(1-v/hi)*(Hh-T-B);
  let g=`<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--sub);stroke-width:1.2"/></pattern></defs>`;
  for(let j=0;j<=4;j++){ const v=hi*j/4; g+=`<line class="${j?'gl':'ax'}" x1="${L0}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${W-R+6}" y="${(y(v)+4).toFixed(1)}">${j?'00':'0'}</text>`; }
  if(o.band){ const up=o.band.map((b,i)=>`${(x(i)+bw/2).toFixed(1)} ${y(b[1]).toFixed(1)}`), dn=o.band.map((b,i)=>`${(x(i)+bw/2).toFixed(1)} ${y(b[0]).toFixed(1)}`).reverse(); g+=`<path class="area" d="M${up.join('L')}L${dn.join('L')}Z"/>`; }
  const k=o.vals.length, pk=k-(o.prel||0);
  o.vals.forEach((v,i)=>{ if(v==null) return; const p=i>=pk; g+=`<rect class="${p?'colp':'col'}" data-i="${i}" x="${(x(i)+bw*.15).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw*.7).toFixed(1)}" height="${(y(0)-y(v)).toFixed(1)}"/>`+(p?`<rect x="${(x(i)+bw*.15).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw*.7).toFixed(1)}" height="${(y(0)-y(v)).toFixed(1)}" fill="url(#${id})" style="pointer-events:none"/>`:''); });
  if(o.med) g+=`<path class="med" d="M${o.med.map((v,i)=>`${(x(i)+bw/2).toFixed(1)} ${y(v).toFixed(1)}`).join('L')}"/>`;
  (o.ticks||[0,n-1]).forEach((i,j,a)=>g+=`<text x="${(x(i)+bw/2).toFixed(1)}" y="${Hh-5}" text-anchor="${j===0?'start':j===a.length-1?'end':'middle'}">${o.xl(i)}</text>`);
  el.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="${esc(o.aria||'Colunas')}">${g}<g class="tip" style="display:none;pointer-events:none"><rect rx="4" width="190" height="44"/><text class="t1" x="10" y="18" style="font-weight:600"></text><text class="t2" x="10" y="36"></text></g></svg>`;
  const svg=el.querySelector('svg'), tip=svg.querySelector('.tip');
  svg.onmousemove=e=>{ const r=e.target.closest('rect[data-i]'); if(!r){tip.style.display='none';return;} const i=+r.dataset.i; tip.style.display='';
    tip.setAttribute('transform',`translate(${x(i)>W-230?x(i)-195:x(i)+bw+4},${T+4})`); tip.querySelector('.t1').textContent=o.tipx(i)+(i>=pk?' · preliminar':''); tip.querySelector('.t2').textContent=o.tipv||'00.000 casos'; };
  svg.onmouseleave=()=>tip.style.display='none';
});}

/* ---------- formas em HTML ---------- */
const shares = (base,key) => { const w=base.map(b=>b.w*jit(key+b.k,.5)), s=w.reduce((a,b)=>a+b,0); return base.map((b,i)=>({...b,p:w[i]/s*100})); };
const segBg = c => c==='hatch'?'':`background:${c}`;
const b100 = (parts,o={}) => `<div class="b100 ${o.sm?'sm':''} ${o.dim?'dimmable':''}" role="img" aria-label="${esc(o.aria||'Barra que soma 100%')}">${parts.map(p=>`<i data-k="${p.k}" class="${p.c==='hatch'?'h':''}" style="width:${p.p.toFixed(2)}%;${segBg(p.c)}" title="${esc(p.s||p.n)}: 00%"></i>`).join('')}</div>`;
const keys = (parts,o={}) => `<div class="keys" ${o.id?`id="${o.id}"`:''}>${parts.map(p=>`<div class="key" data-k="${p.k}"><i class="${p.c==='hatch'?'hatch':''}" style="${segBg(p.c)};${p.c==='hatch'?'box-shadow:inset 0 0 0 1px var(--line2)':''}"></i><span>${esc(o.long?p.n:(p.s||p.n))}</span>${o.noval?'':'<em>00%</em>'}</div>`).join('')}</div>`;
const bindKeys = root => { root.querySelectorAll('.key').forEach(k=>{ k.onmouseenter=()=>{ root.querySelectorAll('.dimmable').forEach(b=>{b.classList.add('dim'); b.querySelectorAll('i').forEach(i=>i.classList.toggle('hi',i.dataset.k===k.dataset.k));}); k.classList.add('on'); };
  k.onmouseleave=()=>{ root.querySelectorAll('.dimmable').forEach(b=>b.classList.remove('dim')); k.classList.remove('on'); }; }); };
const trk = (list,key,o={}) => `<span class="trk" aria-hidden="true">${o.goal!=null?`<span class="goal" style="left:${o.goal}%"></span>`:''}${list.slice().reverse().map(p=>{ const v=(o.lo||12)+(o.span||70)*hsh(p.k+key);
  return (o.ci&&p.c!=='tk'?`<span class="ci" style="left:${v-4-3*hsh(p.k+key+'w')}%;width:${8+6*hsh(p.k+key+'w')}%"></span>`:'')+`<span class="${p.c}" style="left:${v.toFixed(1)}%"></span>`; }).join('')}</span>`;
const sit = (kind,title,text) => { const sw=kind==='state'?'background:var(--r2)':kind==='soon'?'background:var(--track)':'';
  return `<div class="sit" role="note"><i class="sw ${kind==='nodata'?'hatch':''}" style="${sw}"></i><div><h3>${title}</h3><p>${text}</p></div></div>`; };
const placeSel = (id,cur,label='Lugar') => `<label class="fld"><span>${label}</span><select id="${id}"><option value="__p" ${cur==='__p'?'selected':''}>${esc(L.name)}${L.parent?' (estado)':''}</option>${L.ids.map(k=>`<option value="${k}" ${k===cur?'selected':''}>${esc(L.units[k].n)}</option>`).join('')}</select></label>`;
const startPlace = () => (S.u&&L.units[S.u])?S.u:L.def;

/* ---------- séries ilustrativas ---------- */
const Y0=()=>C.years.first, Y1=()=>C.years.last, NY=()=>Y1()-Y0()+1;
const pandA=()=>2020-Y0();
const shape=(k,yr)=>{ const t=(yr-1996)/29, pd=yr===2020?1:yr===2021?1.6:0;
  switch(k){ case 'all':return 1-.26*t+.14*pd; case 'circ':return .62-.2*t+.03*pd; case 'cancer':return .36+.05*t; case 'ext':return .3+.03*Math.sin(t*6); case 'resp':return .26-.03*t+.02*pd;
    case 'endo':return .1+.06*Math.min(t*2,1); case 'inf':return .2-.1*t; case 'covid':return yr<2020?null:yr===2020?.5:yr===2021?.8:yr===2022?.14:.04; case 'nerv':return .06+.06*t; case 'dig':return .14-.02*t;
    case 'mal':return .4*Math.exp(-3*t)+.06; case 'out':return .22+.02*t; case 'infant':return .9*Math.exp(-1.7*t)+.12; case 'mat':return .55-.18*t+.4*pd; case 'births':return 1-.2*t-.06*(yr>=2016?1:0); case 'planos':return .7+.12*Math.min(t*1.6,1)-.04*(yr>=2015&&yr<=2018?1:0);
    default:return .5; } };
const ser=(k,place,a=Y0(),b=Y1())=>{ const out=[]; const j=jit(place+k,.4); for(let yr=a;yr<=b;yr++){ const s=shape(k,yr); out.push(s==null?null:Math.max(.005,s*j*(1+(hsh(place+k+yr)-.5)*.05))); } return out; };
const yrsLine=(el,list,k,o={})=>line(el,Object.assign({n:NY(),series:list.map((p,i)=>({n:p.n,main:i===0,vals:ser(k,p.k)})),xl:i=>String(Y0()+i),ticks:MOB()?[0,14,NY()-1]:[0,4,9,14,19,24,NY()-1],prel:C.years.prel,bands:[{a:pandA(),b:pandA()+1,label:t2('Pandemia de covid-19','Pandemia')}]},o));

/* ---------- página ---------- */
const setFlag=()=>{ const sb=L.sb; if(sb&&sb.flag) document.documentElement.style.setProperty('--flag',sb.flag[SW.theme()]||sb.flag.light); };
function shell(){
  const T=C.TABS.map(g=>({...g,items:g.items.map(([k,n])=>[k,k==='expvida'?`${n}${OUT}`:n])})), lab=(T.flatMap(g=>g.items).find(i=>i[0]===S.p)||[])[1];
  $('hdr').innerHTML=`<header class="top"><div class="wrap top-in"><a class="brand" href="${href('geral',{lv:'BR'})}"><span class="logo"><i></i><i></i><i></i><i></i></span>StatWorld</a>
    <nav aria-label="Temas">${C.themes.map(n=>n===C.theme?`<a class="on" aria-current="page" href="${href('geral',{lv:'BR'})}">${n}</a>`:`<a href="#">${n}</a>`).join('')}</nav>
    <button class="btn" id="themeBtn" type="button">Tema escuro</button></div></header>`;
  $('themeBtn').onclick=SW.toggleTheme; SW.syncThemeBtn(); SW.onTheme.push(setFlag); setFlag();
  const cr=[`<a href="${href('geral',{lv:'BR'})}">${C.theme}</a>`]; const sep='<span>/</span>';
  if(L.key==='BR') cr.push(S.p==='geral'?`<span>${C.country.name}</span>`:`<a href="${href('geral')}">${C.country.name}</a>`);
  else { cr.push(`<a href="${href('geral',{lv:'BR'})}">${C.country.name}</a>`); cr.push(S.p==='geral'?`<span>${L.name}</span>`:`<a href="${href('geral')}">${L.name}</a>`); }
  if(S.p==='ficha'){ cr.push(`<span>${esc(pname(fichaId()))}</span>`); } else if(S.p!=='geral') cr.push(`<span>${lab||''}</span>`);
  $('crumb').innerHTML=cr.join(sep);
  $('title').textContent=S.p==='ficha'?pname(fichaId()):L.title;
  document.title=`${S.p==='ficha'?pname(fichaId()):(lab||'Visão geral')} · ${L.title} · StatWorld`;
  if(S.p!=='ficha'){
    const subs=Object.values(C.sub);
    $('lvl').innerHTML=`<div class="lvl">${L.key==='BR'?`<b>${C.country.name} por ${C.country.unit}</b>${subs.map(s=>`<span aria-hidden="true">·</span><a href="${href(S.p,{lv:s.key})}">${s.name} por ${s.unit}</a>`).join('')}<span aria-hidden="true">·</span><span>outros estados por município <em class="soon">em breve</em></span>`
      :`<a href="${href(S.p,{lv:'BR'})}">${C.country.name} por ${C.country.unit}</a><span aria-hidden="true">·</span><b>${L.name} por ${L.unit}</b>`}</div>`;
    SW2.href=k=>href(k); const nav=SW2.mountNav($('tabs'),S.p,T); nav.setAttribute('aria-label','Seções de '+C.theme);
    nav.querySelectorAll('a.nv-i').forEach(a=>{ if(a.getAttribute('href')===C.links.expvida){ a.title='Abre no tema Demografia'; } });
  }
}
H.mount=()=>{ C=window.SW_CFG; L=mkLevel(); shell(); (TAB[S.p]||TAB.geral)();
  let w=document.documentElement.clientWidth; new ResizeObserver(()=>{ const n=document.documentElement.clientWidth; if(n!==w){ w=n; clearTimeout(H._t); H._t=setTimeout(H.reflow,120); } }).observe(document.body); };

/* ---------- molde mapa + ficha + ranking ---------- */
function mapTab(o){
  const st={m:(o.measures.includes(S.m)?S.m:o.cur), sel:(S.u&&L.units[S.u])?S.u:L.def, hov:null};
  $('body').innerHTML=`${o.pre||''}${o.measures.length>1?`<div class="ctrl">${o.chips?`<div class="prods" id="seg" role="tablist" aria-label="Medida"></div>`:`<div class="seg" id="seg" role="tablist" aria-label="Medida"></div>`}</div>`:''}
    <div class="grid"><div><div class="vh"><div><h2 id="mh"></h2><p id="ms"></p></div></div><div id="mst" style="margin-top:8px"></div><div id="mnote"></div>
      <div id="map" style="margin-top:16px"></div><div id="legend"></div>${o.below?`<div class="blk" id="below"></div>`:''}</div>
      <aside class="side"><div id="sideTop"></div><div id="card"></div><div id="rank"></div></aside></div>`;
  const hov=u=>{st.hov=u;draw()}, clk=u=>{st.sel=u;draw();o.onSel&&o.onSel(st)};
  const map=mkMap($('map'),{aria:'',onHover:hov,onClick:clk}), rank=new Rank($('rank'),{onHover:hov,onClick:clk});
  let rows=[];
  const measure=()=>{ const m=C.measures[st.m];
    $('mh').textContent=t2(m.h,m.l); $('ms').textContent=m.long+(L.key==='BR'?', por estado.':', por município.');
    $('mst').innerHTML=mstamp(m)+(m.f==='mensal'?'':'');
    $('mnote').innerHTML=note(`${m.what}${L.key!=='BR'&&(m.avg3||m.rare)?` <b>${m.rare?`Em ${L.units_} com menos de ${SW.num(C.small.rare/1000,0)} mil habitantes há poucos casos por ano para comparar; eles aparecem pontilhados.`:`Em ${L.units_} com menos de ${SW.num(C.small.avg3/1000,0)} mil habitantes usamos a média de 3 anos; abaixo de ${SW.num(C.small.few/1000,0)} mil, há poucos casos para comparar.`}</b>`:''}${m.prel?` <b>O período mais recente é preliminar.</b>`:''}`);
    map.svg?map.svg.setAttribute('aria-label',m.long):map.m.svg.setAttribute('aria-label',m.long);
    rows=L.ids.map(id=>{ const fl=L.flag(id,m); return {id,v:ill(id,st.m),nd:isNd(id,st.m),few:fl==='few',avg:fl==='avg',txt:m.ph}; });
    map.update(id=>{ const r=rows.find(x=>x.id===id); return {k:cls(r.v),nd:r.nd,few:r.few}; });
    $('legend').innerHTML=legend(m,{nd:rows.filter(r=>r.nd).length,few:rows.filter(r=>r.few&&!r.nd).length});
    draw(); o.onSel&&o.onSel(st); };
  const draw=()=>{ const m=C.measures[st.m], show=st.hov||st.sel, u=L.units[show], r=rows.find(x=>x.id===show)||{};
    map.mark(st.sel,st.hov);
    const facts=(o.facts||[]).filter(k=>k!==st.m).map(k=>{const f=C.measures[k], fl=L.flag(show,f); return `<div class="fact"><span>${f.long}</span><b>${fl==='few'?'poucos casos':f.ph}</b></div>`;}).join('');
    const big=r.nd?`<div class="nodata"><i class="sw-h"></i>Sem dado para este ${L.unit}</div>`:r.few?`<div class="nodata"><i class="sw-h dots" style="background-color:transparent"></i>Poucos casos para comparar</div>`:`<div class="big">${m.ph.replace(/^R\$ /,'R$&nbsp;')}<small>${m.unit}</small></div>`;
    const sub=C.sub[show];
    const link=L.key==='BR'?(sub?`<a class="lnk" href="${href(S.p,{lv:sub.key})}">Ver os ${sub.units} de ${sub.name} ${ARW}</a>`:`<span class="line" style="color:var(--sub)">Municípios de ${esc(u.n)} <em class="soon">em breve</em></span>`)
      :`<a class="lnk" href="${href('ficha',{u:show})}">Abrir a ficha de saúde de ${esc(u.n)} ${ARW}</a>`;
    $('card').innerHTML=`<div class="card" aria-live="polite"><div class="meta">${L.key==='BR'?u.r:`${L.regionLabel} de ${esc(u.r)}`}</div>
      <div class="nm">${esc(u.n)}</div>${big}
      ${r.avg?`<div class="line" style="color:var(--sub);font-size:14px">Média de 3 anos: o município tem menos de ${SW.num(C.small.avg3/1000,0)} mil habitantes.</div>`:''}
      ${r.few?`<div class="line" style="color:var(--sub);font-size:14px">Com tão poucos casos por ano, a taxa muda muito de um ano para outro. Compare com ${L.name}: ${m.ph}.</div>`:''}
      <div class="facts">${L.parent?`<div class="fact"><span>${L.name}</span><b>${m.ph}</b></div>`:''}<div class="fact"><span>${C.country.name}</span><b>${m.ph}</b></div>${facts}</div>
      <div style="margin-top:8px">${mstamp(m)}</div><div style="margin-top:10px">${link}</div></div>`;
    $('sideTop').innerHTML=o.side?o.side(show):''; $('sideTop').hidden=!o.side;
    rank.render({rows,sel:st.sel,hov:st.hov,col:m.col,ci:m.rare});
  };
  if(o.measures.length>1){ if(o.chips){ const el=$('seg'), paint=c=>el.innerHTML=o.measures.map(k=>`<button class="prod ${k===c?'on':''}" role="tab" aria-selected="${k===c}" data-k="${k}">${C.measures[k].l}</button>`).join('');
      paint(st.m); el.onclick=e=>{const b=e.target.closest('button'); if(b){st.m=b.dataset.k; paint(st.m); measure();}}; }
    else SW2.seg($('seg'),o.measures.map(k=>[k,C.measures[k].l]),st.m,k=>{st.m=k;measure();}); }
  measure(); return st;
}
const viewSeg=(views,cur)=>`<div class="ctrl"><div class="seg" id="vseg" role="tablist" aria-label="Vista"></div></div>`;
const bindViews=(views,cur,on)=>SW2.seg($('vseg'),views,cur,on);

/* ---------- abas ---------- */
const TAB={};
TAB.geral=()=>mapTab({measures:C.overview,cur:'mort',facts:C.overview});

TAB.obitos=()=>{
  const views=[['causa','Por causa'],['idade',t2('Por idade e sexo','Idade e sexo')],['tempo',t2('Ao longo do tempo','No tempo')]];
  const st={v:views.some(v=>v[0]===S.v)?S.v:'causa', pl:startPlace(), rate:'pad'};
  $('body').innerHTML=`${viewSeg()}<div class="ctrl2">${placeSel('pl',st.pl)}<div class="seg sm" id="rseg" role="tablist" aria-label="Tipo de taxa"></div></div><div id="ob"></div>`;
  bindViews(views,st.v,k=>{st.v=k;render();}); $('pl').onchange=e=>{st.pl=e.target.value;render();};
  SW2.seg($('rseg'),[['pad',t2('Padronizada por idade','Padronizada')],['bruta','Bruta']],st.rate,k=>{st.rate=k;render();});
  const m=C.measures.mort, few=()=>L.flag(st.pl,m)==='few', avg=()=>L.flag(st.pl,m)==='avg';
  const rateTxt=()=>st.rate==='pad'?'padronizada por idade':'bruta, sem padronizar';
  const what=()=>`<aside class="what"><h3>O que estes números medem</h3>
      <div class="kv"><b>000.000</b><span>mortes de moradores de ${esc(pname(st.pl))} em ${C.years.final}</span></div>${stamp('sim',String(C.years.final),'anual')}
      <p>Cada morte é contada pela causa básica escrita na declaração de óbito e agrupada pelos capítulos da CID-10, a classificação internacional de doenças.</p>
      <p class="s">${st.rate==='pad'?'A taxa padronizada usa a mesma distribuição de idade para todos os lugares. Assim um lugar com mais idosos não aparece com taxa maior só por isso.':'A taxa bruta divide as mortes pela população. Lugares com mais idosos têm taxa bruta maior; use a padronizada para comparar.'}</p>
      <p class="s">A parte de causas mal definidas indica a qualidade do registro: quanto maior, menos se sabe sobre a causa.</p>
      <p class="s">${C.years.last} ainda é preliminar: os registros continuam chegando. Por isso esta vista mostra ${C.years.final}.</p></aside>`;
  const render=()=>{ $('rseg').style.display=st.v==='idade'?'none':''; const list=cmpOf(st.pl), pn=esc(pname(st.pl)), E=$('ob');
    if(st.v==='causa'){ const sh=list.map(p=>({p,parts:shares(C.causes,p.k)}));
      E.innerHTML=`<div class="two"><div>
        <div class="vh"><div><h2>${t2(`De que se morre em ${pn}`,`Causas de morte, ${pn}`)}</h2><p>${t2(`Cada 100 mortes em ${C.years.final}, por grupo de causas, e a taxa de cada grupo comparada com ${L.parent?`${esc(L.name)} e o ${C.country.name}`:`o ${C.country.name}`}.`,`Cada 100 mortes em ${C.years.final}.`)}</p></div></div>
        <div class="blk" style="margin-top:20px"><h3 class="sec-h" style="margin-bottom:12px">Cada 100 mortes${few()?`, soma de ${C.years.final-4} a ${C.years.final}`:''}</h3>
          <div style="display:grid;gap:12px">${sh.map(({p,parts})=>`<div class="b100-r"><div><b>${esc(p.n)}</b><span>${p.k===st.pl?'000.000 mortes':''}</span></div>${b100(parts,{dim:true,aria:`Cada 100 mortes em ${p.n}`})}</div>`).join('')}</div>
          ${keys(sh[0].parts)}</div>
        <div class="blk"><h3 class="sec-h">Mortes por 100 mil habitantes, ${rateTxt()}</h3>
          ${few()?`<div style="margin-top:12px">${sit('few','Poucos casos para comparar',`${pn} tem menos de ${SW.num(C.small.few/1000,0)} mil habitantes. Com tão poucas mortes por ano, as taxas por causa mudam muito de um ano para outro. Use as partes acima, que somam cinco anos, ou compare com ${esc(L.name)}.`)}</div>`:
          `${cmpLegend(list)}${avg()?`<p class="srcnote" style="padding:6px 0 0">Média de 3 anos, de ${C.years.final-2} a ${C.years.final}: o município tem menos de ${SW.num(C.small.avg3/1000,0)} mil habitantes.</p>`:''}
          <div class="dm-h" style="margin-top:16px"><span>Causa</span><span></span><span style="text-align:right">${esc(pname(st.pl)).slice(0,14)}</span><span style="text-align:right">${C.country.name}</span></div>
          <ul class="dm">${C.causes.filter(c=>!c.quality).map(c=>`<li><span class="nm"><i style="background:${c.c}"></i><span>${esc(c.s)}<small>CID-10 ${c.cid}</small></span></span>${trk(list,c.k+st.rate)}<span class="v">000,0</span><span class="v s">000,0</span></li>`).join('')}</ul>`}
        </div></div>${what()}</div>`;
      bindKeys(E); }
    else if(st.v==='idade'){ const ages=C.ages;
      const W={ '0':{inf:.12,resp:.1,nerv:.08,out:.55,ext:.05,mal:.1}, '1–14':{ext:.3,cancer:.12,resp:.1,nerv:.1,inf:.08,out:.25,mal:.05}, '15–29':{ext:.7,cancer:.06,out:.12,inf:.04,circ:.03,mal:.05},
        '30–49':{ext:.3,circ:.17,cancer:.16,dig:.08,inf:.06,endo:.04,out:.12,mal:.05,covid:.02}, '50–69':{circ:.3,cancer:.25,resp:.07,endo:.08,dig:.07,ext:.06,out:.1,mal:.04,covid:.03,nerv:.02}, '70+':{circ:.33,cancer:.15,resp:.16,endo:.08,nerv:.07,dig:.04,out:.1,mal:.05,covid:.02}};
      const parts=(a,sx)=>shares(C.causes.map(c=>({...c,w:((W[a]||{})[c.k]||.005)*(c.k==='ext'&&sx==='f'&&a!=='0'?.35:1)*(c.k==='cancer'&&sx==='f'?1.2:1)*100})),st.pl+a+sx);
      E.innerHTML=`<div class="two"><div><div class="vh"><div><h2>${t2(`De que se morre em cada idade, ${pn}`,`Causas por idade, ${pn}`)}</h2><p>${t2(`Mortes de ${C.years.final} por grupo de causas. Cada barra soma 100% das mortes daquela idade e sexo: mostra o que mais pesa em cada fase da vida, não quantas pessoas morreram.`,`Cada barra soma 100% das mortes da idade.`)}</p></div></div>
        ${keys(C.causes,{noval:true})}
        <div class="ag" style="margin-top:24px"><span></span><span class="hd">Mulheres</span><span class="hd">Homens</span>
        ${ages.map(([a,al])=>`<span class="a">${t2(al,a+' anos').replace('0 anos','< 1 ano')}<small>00.000 · 00.000</small></span>${b100(parts(a,'f'),{dim:true,aria:`Mulheres, ${al}`})}${b100(parts(a,'m'),{dim:true,aria:`Homens, ${al}`})}`).join('')}</div>
        ${few()?note(`Em ${pn} há poucas mortes em cada idade. As barras somam cinco anos, de ${C.years.final-4} a ${C.years.final}.`):''}
        </div>${what()}</div>`;
      bindKeys(E); }
    else { const cs=C.causes.filter(c=>c.k!=='out');
      E.innerHTML=`<div class="vh"><div><h2>${t2(`As causas de morte de ${Y0()} a ${Y1()}`,`Causas de morte no tempo`)}</h2><p>${t2(`Mortes por 100 mil habitantes, ${rateTxt()}, em ${list.map(p=>esc(p.n)).join(', ').replace(/, ([^,]*)$/,' e $1')}. O trecho tracejado é preliminar.`,`Por 100 mil habitantes, ${rateTxt()}.`)}</p></div>${stamp('sim',`${Y0()}–${Y1()}`,'anual',{prel:true})}</div>
        ${cmpLegend(list).replace('<div class="lgd">','<div class="lgd"><span><i class="ln d"></i>Preliminar</span><span><i class="bd"></i>Pandemia de covid-19</span>').replace(/<i class="pt[^"]*"><\/i>/,'<i class="ln"></i>').replace(/<i class="rg"><\/i>/,'<i class="ln s"></i>').replace(/<i class="tk"><\/i>/,'<i class="ln s" style="opacity:.55"></i>')}
        <div class="blk" style="margin-top:20px"><h3 class="sec-h" style="margin-bottom:8px">Todas as causas</h3><div id="tall"></div></div>
        ${few()?note(`${pn} tem poucos casos por ano: as linhas usam médias móveis de 3 anos.`):''}
        <div class="mult">${cs.map(c=>`<div><h4><i class="${c.c==='hatch'?'hatch':''}" style="${segBg(c.c)}"></i>${esc(c.s)}</h4><small>CID-10 ${c.cid}${c.from?` · desde ${c.from}`:''}</small><div id="sm-${c.k}" style="margin-top:6px"></div></div>`).join('')}</div>`;
      const sl=list.filter(p=>p.c!=='tk'||list.length<3);
      yrsLine($('tall'),list.map(p=>({...p,k:p.k+st.rate})),'all',{aria:'Todas as causas, mortes por 100 mil habitantes',h:MOB()?200:260});
      cs.forEach(c=>yrsLine($('sm-'+c.k),[list[0],list[list.length-1]].map(p=>({...p,k:p.k+st.rate})),c.k,{mini:true,h:120,ticks:[0,NY()-1],aria:c.n})); }
  };
  render();
};

TAB.infantil=()=>{
  const views=[['inf','Infantil'],['mat','Materna']], cur=views.some(v=>v[0]===S.v)?S.v:'inf';
  mapTab({measures:['inf','mat'],cur,facts:['inf','mat'],below:true,onSel:st=>{ const list=cmpOf(st.sel), m=C.measures[st.m];
    $('below').innerHTML=`<div class="vh"><div><h2>${t2(`${m.l} de ${Y0()} a ${Y1()}`,`${m.l} no tempo`)}</h2><p>${m.unit[0].toUpperCase()+m.unit.slice(1)}, em ${list.map(p=>esc(p.n)).join(' e ')}.</p></div></div>
      <div class="lgd"><span><i class="ln"></i>${esc(list[0].n)}</span>${list.slice(1).map(p=>`<span><i class="ln s"></i>${esc(p.n)}</span>`).join('')}<span><i class="ln d"></i>Preliminar</span></div><div id="tl" style="margin-top:8px"></div>`;
    yrsLine($('tl'),list,st.m==='inf'?'infant':'mat',{aria:`${m.long}, ${Y0()} a ${Y1()}`,bands:st.m==='mat'?[{a:pandA(),b:pandA()+1,label:'Pandemia de covid-19'}]:[]}); }});
};

TAB.nasc=()=>{
  const st={pl:startPlace()};
  $('body').innerHTML=`<div class="ctrl2" style="margin-top:24px">${placeSel('pl',st.pl)}</div><div id="nb"></div>`;
  $('pl').onchange=e=>{st.pl=e.target.value;render();};
  const render=()=>{ const list=cmpOf(st.pl), pn=esc(pname(st.pl)), few=L.flag(st.pl,{avg3:true})==='few';
    $('nb').innerHTML=`<div class="vh" style="margin-top:28px"><div><h2>${t2(`Cada 100 bebês nascidos em ${pn}`,`Cada 100 bebês, ${pn}`)}</h2><p>${t2(`Nascidos vivos de mães que moram em ${pn}, em ${C.years.final}. Um quadrado é um bebê em cada 100.`,`Um quadrado é um bebê em cada 100.`)}</p></div>${stamp('sinasc',String(C.years.final),'anual')}</div>
      <div class="kv" style="margin-top:16px"><b>00.000</b><span>nascidos vivos em ${C.years.final}</span></div>
      ${few?note(`${pn} tem poucos nascimentos por ano. Os quadrados somam cinco anos, de ${C.years.final-4} a ${C.years.final}.`):''}
      <div class="c100">${C.births.map(b=>{ const on=Math.round(b.w*jit(st.pl+b.k,.3)); return `<div><h3>${b.t}</h3>
        <div class="wf" role="img" aria-label="${esc(b.t)}: 00 em cada 100">${Array.from({length:100},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('')}</div>
        <div class="n"><b>00</b><span>em cada 100</span></div>
        <div class="cmp">${list.slice(1).map(p=>`${esc(p.n)}: <b>00</b>`).join(' · ')}</div><p>${b.d}</p></div>`; }).join('')}</div>
      <div class="blk"><div class="vh"><div><h2>${t2(`Nascidos vivos por ano, ${Y0()} a ${Y1()}`,'Nascidos vivos por ano')}</h2><p>Total de nascidos vivos de mães que moram em ${pn}.</p></div>${stamp('sinasc',`${Y0()}–${Y1()}`,'anual',{prel:true})}</div><div id="bl" style="margin-top:12px"></div></div>`;
    yrsLine($('bl'),[list[0]],'births',{aria:'Nascidos vivos por ano',bands:[],yl:'000'}); };
  render();
};

TAB.vac=()=>{
  const st={pl:startPlace()};
  $('body').innerHTML=`<div class="ctrl2" style="margin-top:24px">${placeSel('pl',st.pl)}</div><div id="vb"></div>`;
  $('pl').onchange=e=>{st.pl=e.target.value;render();};
  const yrs=[2015,Y1()], ny=yrs[1]-yrs[0]+1;
  const render=()=>{ const pn=esc(pname(st.pl)), m=C.measures.vac;
    $('vb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${t2('Quanto falta para a meta, vacina por vacina','Quanto falta para a meta')}</h2><p>${t2(`Cobertura de cada vacina do calendário infantil em ${pn}, em ${Y1()}. O traço é a meta; a parte riscada é o que falta para chegar nela.`,`Cobertura em ${Y1()}. O traço é a meta.`)}</p></div></div>
      <div class="lgd" style="margin-top:12px"><span><i class="bd" style="background:var(--bar);box-shadow:none"></i>Cobertura</span><span><i class="tk"></i>Meta</span><span><i class="bd hatch"></i>Falta para a meta</span><span><i class="bd" style="background:var(--accent);box-shadow:none"></i>Ano com meta atingida</span><span><i class="bd hatch" style="box-shadow:inset 0 0 0 1px var(--sub)"></i>Preliminar</span></div>
      <div class="vx-h" style="margin-top:16px"><span>Vacina</span><span>Cobertura em ${Y1()}</span><span>Situação</span><span>Meta atingida, ${yrs[0]} a ${yrs[1]}</span></div>
      <ul class="vx">${C.vaccines.map(v=>{ const cov=Math.min(99,v.cov*100*jit(st.pl+v.k,.16)), ok=cov>=v.meta;
        return `<li><span class="nm"><b>${v.n}</b><span>${v.a}</span></span>
        <span class="vbar" role="img" aria-label="${v.n}: cobertura 00,0%, meta ${v.meta}%"><span class="cv" style="width:${cov.toFixed(1)}%"></span>${ok?'':`<span class="gap" style="left:${cov.toFixed(1)}%;width:${(v.meta-cov).toFixed(1)}%"></span>`}<span class="mt" style="left:${v.meta}%"></span></span>
        <span class="st"><b>00,0%</b>${ok?'Meta atingida':`faltam 0,0 pontos`}</span>
        <span class="yw"><span class="yrs" role="img" aria-label="Anos com meta atingida: 00 de ${ny}">${Array.from({length:ny},(_,i)=>`<i class="${i===ny-1?'p':hsh(st.pl+v.k+i)>(i<4?.25:.6)?'ok':''}"></i>`).join('')}</span><span class="yrs-l"><span>${yrs[0]}</span><span>${yrs[1]}</span></span></span></li>`; }).join('')}</ul></div>
      <aside class="what"><h3>Como se mede</h3><div class="kv"><b>00,0%</b><span>cobertura média das vacinas até 1 ano em ${pn}</span></div>${mstamp(m,{prel:true})}
        <p>Cobertura é o número de doses aplicadas dividido pelo número de crianças daquela idade. A meta é de 90% para BCG e rotavírus e de 95% para as demais.</p>
        <p class="s">Pode passar de 100% quando crianças de outros lugares se vacinam aqui ou quando a estimativa de crianças fica abaixo da real. Por isso as barras param em 100%.</p>
        <p class="s">${Y1()} é preliminar: doses aplicadas no fim do ano ainda entram no sistema.</p>
        <a class="lnk" href="${href('doencas')}">Doenças acompanhadas ${ARW}</a></aside></div>`; };
  render();
};

TAB.doencas=()=>{
  const ds=C.diseases, st={d:ds.some(d=>d.k===S.d)?S.d:'dengue', pl:startPlace(), hov:null};
  $('body').innerHTML=`<div class="ctrl"><div class="prods" id="dz" role="tablist" aria-label="Doença"></div></div><div class="ctrl2">${placeSel('pl',st.pl)}</div>
    <div class="grid"><div id="db"></div><aside class="side"><div id="dw"></div><div id="rank"></div></aside></div>`;
  const paint=()=>$('dz').innerHTML=ds.map(d=>`<button class="prod ${d.k===st.d?'on':''}" role="tab" aria-selected="${d.k===st.d}" data-k="${d.k}">${d.n}<span class="freq" style="${d.k===st.d?'color:inherit;border-color:currentColor':''}">${FQ[d.f]}</span></button>`).join('');
  paint(); $('dz').onclick=e=>{const b=e.target.closest('button'); if(b){st.d=b.dataset.k; paint(); render();}};
  $('pl').onchange=e=>{st.pl=e.target.value;render();};
  const rank=new Rank($('rank'),{onHover:u=>{},onClick:u=>{st.pl=u; $('pl').value=u; render();}});
  const WK=44, pw=3;
  const render=()=>{ const d=ds.find(x=>x.k===st.d), pn=esc(pname(st.pl)), wk=d.weekly;
    if(wk){ const cur=[], band=[], med=[], amp=jit(st.pl+d.k,.6);
      for(let i=0;i<52;i++){ const s=Math.exp(-Math.pow((i-14)/7,2)), b=Math.exp(-Math.pow((i-15)/8,2));
        med.push((.08+.6*b)*amp); band.push([(.03+.25*b)*amp,(.15+1.1*b)*amp]); if(i<WK) cur.push((.06+.9*s)*amp*(1+(hsh(st.pl+d.k+i)-.5)*.2)*(i>=WK-pw?(.75-.12*(i-WK+pw)):1)); }
      $('db').innerHTML=`<div class="vh"><div><h2>${t2(`${d.n} semana a semana em 2026, ${pn}`,`${d.n} por semana, ${pn}`)}</h2><p>${t2(`Casos prováveis por semana epidemiológica. A faixa cinza mostra de quanto a quanto variou nos 5 anos anteriores; a linha tracejada é o valor do meio.`,`Casos por semana e faixa dos 5 anos anteriores.`)}</p></div></div>
        <div style="margin-top:8px">${stamp(d.src,`semana ${'00'} de 2026`,'semanal',{prel:true})}</div>
        <div class="lgd" style="margin-top:12px"><span><i class="bd" style="background:var(--bar);box-shadow:none"></i>2026</span><span><i class="bd" style="background:var(--bar);opacity:.5;box-shadow:none"></i>Últimas ${pw} semanas, preliminar</span><span><i class="bd"></i>Faixa de 2021 a 2025</span><span><i class="gl"></i>Valor do meio, 2021 a 2025</span></div>
        <div id="ep" style="margin-top:8px"></div>
        ${note(`<b>As últimas ${pw} semanas ainda estão incompletas.</b> Os casos são notificados com atraso e esses números devem subir nas próximas atualizações. Caso provável é o notificado que não foi descartado por exame.`)}`;
      cols($('ep'),{n:52,vals:cur,band,med,prel:pw,xl:i=>'sem. '+(i+1),ticks:MOB()?[0,25,51]:[0,9,19,29,39,51],tipx:i=>`Semana ${i+1} · 00/00 a 00/00`,tipv:'00.000 casos prováveis',aria:`${d.n}, casos prováveis por semana em 2026`});
    } else { const n=Y1()-2001+1, v=[]; for(let i=0;i<n;i++) v.push((.6+.25*Math.sin(i/4)+(d.k==='sifc'?i*.05:0)-(d.k==='aids'?i*.012:0))*jit(st.pl+d.k,.4)*(1+(hsh(st.pl+d.k+i)-.5)*.1));
      $('db').innerHTML=`<div class="vh"><div><h2>${t2(`${d.n} por ano, 2001 a ${Y1()}, ${pn}`,`${d.n} por ano, ${pn}`)}</h2><p>${d.unit[0].toUpperCase()+d.unit.slice(1)} por ano. Esta doença é acompanhada por ano: não há selo semanal.</p></div></div>
        <div style="margin-top:8px">${stamp(d.src,`2001–${Y1()}`,'anual',{prel:true})}</div><div id="ep" style="margin-top:16px"></div>
        ${note(`${Y1()} é preliminar: casos diagnosticados no fim do ano ainda entram no sistema.`)}`;
      cols($('ep'),{n,vals:v,prel:1,xl:i=>String(2001+i),ticks:MOB()?[0,n-1]:[0,4,9,14,19,n-1],tipx:i=>String(2001+i),tipv:'00.000 '+d.unit,aria:`${d.n} por ano`}); }
    $('dw').innerHTML=`<div class="card"><div class="meta">${wk?'Últimas 4 semanas':`Em ${Y1()}`} · ${pn}</div>
      <div class="row1"><div class="big">00,0<small>por 100 mil</small></div></div>
      <div class="facts"><div class="fact"><span>${d.unit[0].toUpperCase()+d.unit.slice(1)}${wk?' em 2026':''}</span><b>00.000</b></div>${cmpOf(st.pl).slice(1).map(p=>`<div class="fact"><span>${esc(p.n)}, por 100 mil</span><b>00,0</b></div>`).join('')}</div>
      <div style="margin-top:8px">${stamp(d.src,'',d.f,{prel:true})}</div></div>`;
    rank.render({rows:L.ids.map(id=>{const fl=L.flag(id,{avg3:true}); return {id,v:ill(id,d.k),nd:isNd(id,d.k),few:fl==='few',avg:false,txt:'00,0'};}),sel:st.pl,hov:null,col:wk?'Por 100 mil, 4 sem.':'Por 100 mil'});
  };
  render();
};

TAB.pns=()=>{
  const views=[['self','Saúde autoavaliada'],['chronic',t2('Doenças crônicas','Crônicas')],['habits','Hábitos']], P=C.pns;
  const st={v:views.some(v=>v[0]===S.v)?S.v:'self', pl:L.key==='BR'?startPlace():'__p'};
  const stateOnly=L.key!=='BR';
  $('body').innerHTML=`${viewSeg()}${stateOnly?`<div style="margin-top:24px">${sit('state','Só o número do estado',`A Pesquisa Nacional de Saúde entrevista uma amostra de moradores que representa o ${C.country.name} e cada estado, não cada município. Por isso esta aba mostra ${esc(L.name)} inteiro.`)}</div>`:`<div class="ctrl2">${placeSel('pl',st.pl)}</div>`}<div id="pb"></div>`;
  bindViews(views,st.v,k=>{st.v=k;render();}); if(!stateOnly) $('pl').onchange=e=>{st.pl=e.target.value;render();};
  const render=()=>{ const pn=esc(stateOnly?L.name:pname(st.pl)), pk=stateOnly?L.key:st.pl, list=stateOnly?[{k:L.key,n:L.name,c:'pt'},{k:'__BR',n:C.country.name,c:'tk'}]:cmpOf(st.pl).map(p=>p.c==='rg'?{...p,c:'tk'}:p);
    const what=`<aside class="what"><h3>De onde vêm estes números</h3><p>Da Pesquisa Nacional de Saúde, feita em casa com moradores de 18 anos ou mais. A pessoa responde sobre a própria saúde.</p>
      <p class="s">Por ser uma amostra, cada número tem uma margem. A barra clara mostra a faixa em que o valor real deve estar.</p>${stamp('pns',P.year,'estimativa',{})}<p class="s">A pesquisa é feita a cada cinco ou seis anos. Só existe para o ${C.country.name} e os estados.</p></aside>`;
    if(st.v==='self'){ const sc=P.self.map(([n,c],i)=>({k:'s'+i,n,s:n,c,w:[18,48,27,5,2][i]}));
      const rows=[[pn,pk],...(pk==='__p'&&!stateOnly?[]:[[C.country.name,'__BR']]),...P.groups.slice(1).map(([g])=>[`${g}, ${pn}`,pk+g])];
      $('pb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${t2(`Como as pessoas de ${pn} dizem que está a própria saúde`,`Saúde autoavaliada, ${pn}`)}</h2><p>${t2(`Resposta à pergunta “Em geral, como você avalia a sua saúde?”, em ${P.year}. Cada barra soma 100% das pessoas do grupo.`,`Cada barra soma 100%.`)}</p></div></div>
        ${keys(sc)}<div style="display:grid;gap:14px;margin-top:20px">${rows.map(([n,k],i)=>`${i===2?`<h3 class="sec-h" style="margin-top:12px">Por sexo e idade, ${pn}</h3>`:''}<div class="b100-r"><div><b style="${i>1?'font-weight:500':''}">${n.replace(`, ${pn}`,'')}</b></div>${b100(shares(sc,k),{dim:true,aria:n})}</div>`).join('')}</div></div>${what}</div>`;
      bindKeys($('pb')); }
    else { const it=st.v==='chronic'?P.chronic:P.habits;
      $('pb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${st.v==='chronic'?t2(`Doenças crônicas em ${pn}`,`Doenças crônicas, ${pn}`):t2(`Hábitos em ${pn}`,`Hábitos, ${pn}`)}</h2><p>${t2(`Parte das pessoas de 18 anos ou mais, em ${P.year}, com a faixa da margem da pesquisa.`,`% das pessoas de 18 anos ou mais.`)}</p></div></div>
        <div class="lgd">${list.map(p=>`<span><i class="${p.c}"></i>${esc(p.n)}</span>`).join('')}<span><i class="ci"></i>Margem da pesquisa</span></div>
        <div class="dm-h" style="margin-top:16px"><span>${st.v==='chronic'?'Doença':'Hábito'}</span><span></span><span style="text-align:right">${pn.slice(0,14)}</span><span style="text-align:right">${C.country.name}</span></div>
        <ul class="dm">${it.map(([n,d])=>`<li><span class="nm"><span>${n}<small>${d}</small></span></span>${trk(list,n,{ci:true,lo:6,span:60})}<span class="v">00,0%</span><span class="v s">00,0%</span></li>`).join('')}</ul></div>${what}</div>`; }
  };
  render();
};

TAB.rede=()=>{
  const views=[['prof',t2('Profissionais e leitos','Profissionais')],['tempo',t2('Tempo até o hospital','Tempo')]], v=views.some(x=>x[0]===S.v)?S.v:'prof';
  const pre=`${viewSeg()}`;
  if(v==='prof'){ mapTab({pre,measures:['med','enf','leitos','leitosp','uti'],cur:'med',chips:true,facts:['med','enf','leitos','leitosp','uti']}); }
  else { $('body').innerHTML=pre+`<div id="tb"></div>`; renderTempo(); }
  bindViews(views,v,k=>{ if(k!==v) location.href=href('rede',{v:k}); });
};
function renderTempo(){
  if(L.key!=='BR'){ $('tb').innerHTML=`<div style="margin-top:24px">${sit('soon','Em breve neste nível',`O tempo até o hospital mais perto já existe para cada estado. Por município, a conta está sendo conferida. Enquanto isso, veja o número de ${esc(L.name)} em <a href="${href('rede',{lv:'BR',v:'tempo'})}">${C.country.name} por estado</a>.`)}</div>`; return; }
  const tr=C.travel.map(([n,c],i)=>({k:'t'+i,n,s:n,c,w:[38,30,20,9,3][i]}));
  const rows=[['__BR',C.country.name],...L.ids.map(k=>[k,L.units[k].n])].map(([k,n])=>({k,n,parts:shares(tr,k+'tt'),o:k==='__BR'?-1:ill(k,'tempo')})).sort((a,b)=>a.o-b.o);
  $('tb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${t2('Quanto tempo até o hospital mais perto','Tempo até o hospital')}</h2><p>${t2('Parte da população de cada estado pelo tempo estimado de carro até o hospital com leitos de internação mais próximo.','% da população por tempo de carro.')}</p></div></div>
    <div style="margin-top:8px">${stamp('calc','2026','anual',{est:true})}</div>${keys(tr)}
    <div style="display:grid;gap:8px;margin-top:20px">${rows.map(r=>`<div class="b100-r"><div><b style="${r.k==='__BR'?'':'font-weight:400'}">${esc(r.n)}</b></div>${b100(r.parts,{sm:true,dim:true,aria:`${r.n}: parte da população por tempo até o hospital`})}</div>`).join('')}</div></div>
    <aside class="what"><h3>Como foi calculado</h3><p>Estimativa do StatWorld com a grade de população do Censo e o endereço dos hospitais no CNES, pelo caminho de carro.</p><p class="s">Não considera fila, especialidade nem transporte público. Mostra o acesso no mapa, não a garantia de atendimento.</p><p class="s">Ordenado pela parte da população a mais de uma hora, sem juízo sobre o estado.</p></aside></div>`;
  bindKeys($('tb'));
}

TAB.sus=()=>{
  const views=[['int','Internações'],['onde',t2('Onde são atendidos','Onde')]], st={v:views.some(x=>x[0]===S.v)?S.v:'int', pl:startPlace(), rg:''};
  $('body').innerHTML=`${viewSeg()}<div class="ctrl2" id="sc"></div><div id="sb"></div>`;
  bindViews(views,st.v,k=>{st.v=k;render();});
  const render=()=>{ const pn=esc(pname(st.pl));
    if(st.v==='int'){ $('sc').innerHTML=placeSel('pl',st.pl); $('pl').onchange=e=>{st.pl=e.target.value;render();};
      const it=C.hosp.map(([n,cid],i)=>({n,cid,v:(1-i*.09)*jit(st.pl+n,.3)})).sort((a,b)=>b.v-a.v), mx=it[0].v;
      const nm=8*12+10, mv=[]; for(let i=0;i<nm;i++){ const yr=2019+Math.floor(i/12); mv.push((1+.05*Math.sin(i/1.9)-(yr===2020?.22:yr===2021?.1:0)+i*.0015)*jit(st.pl+'sih',.3)*(i>=nm-3?(.9-.12*(i-nm+3)):1)); }
      const MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
      $('sb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${t2(`Por que as pessoas de ${pn} são internadas no SUS`,`Internações no SUS, ${pn}`)}</h2><p>${t2(`Internações por mil habitantes em ${Y1()}, pelo diagnóstico principal.`,`Por mil habitantes, em ${Y1()}.`)}</p></div></div>
        <div class="bl-h" style="margin-top:16px"><span></span><span>Motivo</span><span></span><span style="text-align:right">Por mil hab.</span><span style="text-align:right">Parte</span></div>
        <ol class="bl">${it.map((r,i)=>`<li><span class="n">${i+1}</span><span>${r.n} <small style="color:var(--faint);font-size:12px">${r.cid}</small></span><span class="bar"><i style="width:${r.v/mx*100}%"></i></span><span class="v">00,0</span><span class="s">00%</span></li>`).join('')}</ol>
        <div class="blk"><div class="vh"><div><h2>${t2('Internações por mês','Internações por mês')}</h2><p>Internações no SUS de moradores de ${pn}. Os 3 últimos meses ainda recebem registros.</p></div></div><div id="ml" style="margin-top:12px"></div></div></div>
        <aside class="what"><h3>O que conta</h3><div class="kv"><b>000.000</b><span>internações no SUS em ${Y1()}</span></div>${stamp('sih','',`mensal`,{prel:true})}
          <p>Cada internação paga pelo SUS gera uma autorização (AIH). Contamos pelo município onde a pessoa mora, não onde foi atendida.</p><p class="s">Internações em hospitais privados pagas por planos ou particulares não entram.</p><p class="s">Procedimentos sem internação, como consultas e exames, vêm do SIA/SUS e aparecem na ficha de cada município.</p></aside></div>`;
      line($('ml'),{n:nm,series:[{n:pn,main:true,vals:mv}],xl:i=>`${MES[i%12]} ${String(2019+Math.floor(i/12)).slice(2)}`,tipx:i=>`${MES[i%12]} ${2019+Math.floor(i/12)}`,ticks:MOB()?[0,48,nm-1]:[0,24,48,72,nm-1],prel:3,bands:[{a:14,b:23,label:t2('Pandemia de covid-19','Pandemia')}],yl:'00.000',yv:'00.000 internações',aria:'Internações no SUS por mês'}); }
    else { $('sc').innerHTML=`<label class="fld"><span>${L.regionLabel}</span><select id="rg"><option value="">Todas</option>${L.regions.map(r=>`<option ${r===st.rg?'selected':''}>${esc(r)}</option>`).join('')}</select></label>`;
      if(L.key!=='BR'&&!st.rg) st.rg=L.units[st.pl].r, $('rg').value=st.rg;
      $('rg').onchange=e=>{st.rg=e.target.value;render();};
      const wh=C.where.map(([n,c],i)=>({k:'w'+i,n,s:n,c,w:[70,25,5][i]}));
      const ids=L.ids.filter(k=>!st.rg||L.units[k].r===st.rg), rows=ids.map(k=>({k,n:L.units[k].n,parts:shares(wh.map((w,i)=>({...w,w:i===0?w.w*(L.key==='BR'?1:.2+1.4*ill(k,'onde')):w.w})),k+'w')})).sort((a,b)=>b.parts[0].p-a.parts[0].p);
      $('sb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${t2(`Onde os moradores de cada ${L.unit} são internados`,`Onde são internados`)}</h2><p>${t2(`Internações no SUS em ${Y1()}, pelo lugar do hospital. Ordenado pela parte atendida no próprio município.`,`Pelo lugar do hospital, em ${Y1()}.`)}</p></div></div>
        <div style="margin-top:8px">${stamp('sih',String(Y1()),'anual',{prel:true})}</div>${keys(wh)}
        <div style="display:grid;gap:8px;margin-top:20px">${rows.map(r=>`<div class="b100-r"><div style="${r.k===st.pl?'font-weight:600':''}">${esc(r.n)}</div>${b100(r.parts,{sm:true,dim:true,aria:r.n})}</div>`).join('')}</div></div>
        <aside class="what"><h3>Como ler</h3><p>Municípios pequenos costumam mandar internações para cidades vizinhas com hospital maior. Atender fora não quer dizer atender mal: mostra como a rede está organizada na região.</p><p class="s">Filtre por ${L.regionLabel.toLowerCase()} para ver os vizinhos juntos.</p></aside></div>`;
      bindKeys($('sb')); }
  };
  render();
};

TAB.gasto=()=>mapTab({measures:['gasto'],cur:'gasto',facts:[],side:id=>{ const pay=C.payers.map(([n,c],i)=>({k:'p'+i,n,s:n,c,w:[43,26,31][i]}));
  return `<div class="card"><div class="meta">Quem paga, ${esc(L.units[id].n)}</div>${b100(shares(pay,id+'pay'),{dim:true,aria:'Quem paga o gasto público em saúde'})}${keys(pay).replace('class="keys"','class="keys" style="grid-template-columns:minmax(0,1fr);gap:2px;margin-top:10px"')}
    <div style="margin-top:6px">${stamp('siops','2025','anual')}</div>
    <a class="lnk" style="margin-top:8px" href="${C.links.contas}">Saúde nas Contas públicas, função COFOG 07 ${OUT}</a></div>`; }});

TAB.planos=()=>mapTab({measures:['planos'],cur:'planos',facts:[],below:true,
  side:id=>{ const on=Math.round(25*jit(id+'pl',.9)); return `<div class="card"><div class="meta">Cada 100 pessoas em ${esc(L.units[id].n)}</div>
    <div class="wf c100" style="display:grid;grid-template-columns:repeat(20,minmax(0,1fr));gap:3px;margin-top:10px;max-width:none" role="img" aria-label="00 em cada 100 têm plano de saúde">${Array.from({length:100},(_,i)=>`<i style="aspect-ratio:1;display:block;border-radius:1px;background:${i<on?'var(--accent)':'var(--track)'}"></i>`).join('')}</div>
    <div class="line"><b style="font-size:22px">00</b> têm plano de assistência médica</div><div style="margin-top:4px">${stamp('ans','set 2026','mensal')}</div></div>`; },
  onSel:st=>{ const list=cmpOf(st.sel); $('below').innerHTML=`<div class="vh"><div><h2>${t2('Parte da população com plano, 2000 a 2026','Com plano, 2000 a 2026')}</h2><p>Em ${list.map(p=>esc(p.n)).join(' e ')}, em setembro de cada ano.</p></div></div><div class="lgd"><span><i class="ln"></i>${esc(list[0].n)}</span>${list.slice(1).map(p=>`<span><i class="ln s"></i>${esc(p.n)}</span>`).join('')}</div><div id="pl2" style="margin-top:8px"></div>`;
    line($('pl2'),{n:27,series:list.map((p,i)=>({n:p.n,main:i===0,vals:ser('planos',p.k,2000,2026)})),xl:i=>String(2000+i),ticks:MOB()?[0,26]:[0,5,10,15,20,26],yl:'00%',yv:'00,0%',aria:'Parte da população com plano de saúde por ano'}); }});

/* ---------- ficha do município ---------- */
const fichaId=()=>(S.u&&L.units[S.u])?S.u:(L.sb&&L.sb.ficha&&L.units[L.sb.ficha]?L.sb.ficha:L.def);
TAB.ficha=()=>{
  const id=fichaId(), u=L.units[id], list=cmpOf(id), M=C.measures, yr=String(C.years.final);
  const R=(o)=>o; const FICHA=[
   {k:'vida',g:'Nascer e morrer',rows:[R({m:'mort'}),R({m:'inf'}),R({m:'mat'}),{l:'Nascidos vivos',what:'Bebês nascidos vivos de mães que moram aqui.',ph:'000',unit:'em '+yr,src:'sinasc',ref:yr,f:'anual',nocmp:true},
     {l:'Pré-natal com 7 ou mais consultas',what:'Parte dos nascidos vivos cujas mães fizeram 7 consultas ou mais.',ph:'00%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {l:'Partos cesáreos',what:'Parte dos nascidos vivos que nasceram de cesárea.',ph:'00%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {l:'Mães com até 19 anos',what:'Parte dos nascidos vivos de mães com até 19 anos.',ph:'00%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {l:'Baixo peso ao nascer',what:'Parte dos bebês que nasceram com menos de 2,5 kg.',ph:'00%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {l:'Esperança de vida ao nascer',what:'Já está no tema Demografia.',link:C.links.expvida}]},
   {k:'prev',g:'Prevenção e hábitos',rows:[R({m:'vac',goal:95}),R({m:'dengue'}),{l:'Tuberculose',what:'Casos novos por 100 mil habitantes.',ph:'00,0',unit:'por 100 mil',src:'sinan',ref:String(Y1()),f:'anual',prel:true},
     {l:'Saúde boa ou muito boa',what:'Pessoas de 18 anos ou mais que avaliam a própria saúde como boa ou muito boa.',ph:'00%',unit:'',src:'pns',ref:C.pns.year,f:'estimativa',sit:'state'},
     {l:'Fumam',what:'Pessoas de 18 anos ou mais que fumam cigarro ou outro produto do tabaco.',ph:'00%',unit:'',src:'pns',ref:C.pns.year,f:'estimativa',sit:'state'}]},
   {k:'cuid',g:'Atendimento',rows:[R({m:'med'}),R({m:'enf'}),R({m:'leitos'}),R({m:'uti'}),{l:'Internações no SUS',what:'Internações de moradores, pagas pelo SUS, por mil habitantes.',ph:'00,0',unit:'por mil hab.',src:'sih',ref:String(Y1()),f:'mensal',prel:true},
     {l:'Internados no próprio município',what:'Parte das internações de moradores feitas em hospital daqui.',ph:'00%',unit:'',src:'sih',ref:String(Y1()),f:'anual'},
     {l:'Consultas e exames no SUS',what:'Procedimentos ambulatoriais por habitante.',ph:'0,0',unit:'por hab.',src:'sia',ref:String(Y1()),f:'mensal'},
     {l:'Tempo até o hospital mais perto',what:'Por município, a conta está sendo conferida.',sit:'soon'}]},
   {k:'rec',g:'Gasto e planos',rows:[R({m:'gasto'}),R({m:'planos'})]}];
  const row=r=>{ const m=r.m?{...M[r.m],l:M[r.m].long}:r, fl=r.m?L.flag(id,M[r.m]):'', lab=`<div class="l"><b>${m.l}</b>${r.m?'':`<p>${m.what}</p>`}${m.src?stamp(m.src,m.ref,m.f==='estimativa'?'anual':m.f,{prel:m.prel,est:m.f==='estimativa'}):''}</div>`;
    const ml=t=>`<span class="ml" style="font-size:12px;color:var(--faint)">${t}</span>`;
    if(r.link) return `<div class="fr">${lab}<div class="m" style="grid-column:span 4;text-align:left"><a class="lnk" href="${r.link}">Ver em Demografia ${OUT}</a></div></div>`;
    if(r.sit==='soon') return `<div class="fr">${lab}<div class="m"><span class="nd"><i style="background:var(--track)"></i>em breve</span></div><div class="e">${ml(L.name)}<span class="nd">em breve</span></div><div class="p">${ml(C.country.name)}<b style="font-weight:400">00</b><small>min, mediana</small></div><span></span></div>`;
    if(r.sit==='state') return `<div class="fr">${lab}<div class="m">${ml('Município')}<span class="nd"><i style="background:var(--r2)"></i>só o número do estado</span></div><div class="e">${ml(L.name)}<b style="font-weight:600">${m.ph}</b></div><div class="p">${ml(C.country.name)}${m.ph}</div>${trk(list.filter(p=>p.c!=='pt f'),m.l,{ci:true,lo:10,span:60})}</div>`;
    const big=fl==='few'?`<span class="nd"><i class="dots"></i>poucos casos</span>`:`<b>${m.ph}</b><small>${fl==='avg'?'média de 3 anos':m.unit}</small>`;
    return `<div class="fr">${lab}<div class="m">${ml(esc(u.n))}${big}</div><div class="e">${ml(L.name)}${r.nocmp?'<span style="color:var(--faint)">—</span>':m.ph}</div><div class="p">${ml(C.country.name)}${r.nocmp?'<span style="color:var(--faint)">—</span>':m.ph}</div>${r.nocmp||fl==='few'?'<span></span>':trk(list,m.l,{goal:r.goal})}</div>`; };
  $('lvl').innerHTML=''; $('tabs').innerHTML='';
  $('body').innerHTML=`<div class="fh-top"><div><div class="fh-meta"><span>${L.regionLabel} de ${esc(u.r)}</span><span>${esc(L.name)}</span><span><b style="color:var(--ink);font-weight:600">000.000</b> habitantes</span></div>
      <div style="margin-top:8px">${stamp('pop','2025','anual',{est:true})}</div>
      <p style="font-size:17px;line-height:1.55;max-width:62ch;margin:20px 0 0;text-wrap:pretty">${t2(`Os números de saúde de ${esc(u.n)} ao lado dos números de ${esc(L.name)} e do ${C.country.name}. Taxas por habitante, para comparar lugares de tamanhos diferentes.`,`Saúde de ${esc(u.n)} comparada com ${esc(L.name)} e o ${C.country.name}.`)}</p>
      ${cmpLegend(list.map(p=>p.c==='tk'?p:p))}<div class="lgd" style="margin-top:6px"><span><i class="gl"></i>Meta</span><span><i class="bd" style="background:radial-gradient(circle at 2px 2px,var(--sub) 0.9px,transparent 1.2px) 0 0/5px 5px"></i>Poucos casos para comparar</span><span><i class="bd" style="background:var(--r2);box-shadow:none"></i>Só o número do estado</span></div>
      <nav class="fh-jump" aria-label="Seções da ficha">${FICHA.map(s=>`<a href="#f-${s.k}">${s.g}</a>`).join('')}</nav></div>
    <div class="loc"><div id="loc"></div><a class="lnk" style="margin-top:8px;font-size:14px" href="${href('geral',{u:id})}">Ver no mapa de ${esc(L.name)} ${ARW}</a></div></div>
    ${FICHA.map(s=>`<section class="fh-sec" id="f-${s.k}" aria-labelledby="h-${s.k}"><h2 id="h-${s.k}">${s.g}</h2><div class="fr-h"><span>Indicador</span><span>${esc(u.n).slice(0,16)}</span><span>${esc(L.name)}</span><span>${C.country.name}</span><span></span></div>${s.rows.map(row).join('')}</section>`).join('')}
    ${note(`Todos os números desta ficha ainda são exemplos. Quando o município tem poucos casos, mostramos a média de 3 anos ou o aviso “poucos casos”; quando a fonte não tem o município, mostramos o número do estado.`)}`;
  if(L.key!=='BR'){ const mm=new MunMap($('loc'),{static:true,nolabel:true,aria:`Localização de ${u.n} em ${L.name}`}); mm.update(()=>({k:1})); mm.mark(id,null); }
  else $('loc').parentNode.hidden=true;
};
})();
