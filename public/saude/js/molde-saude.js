// Molde do tema Saúde. Copiado do design da rodada 7 (design/rodada-7-saude/codigo/molde-saude.js) e ligado aos dados:
// no design os números eram de exemplo ("00,0", função ill); aqui cada número vem de window.SW_SAUDE,
// montado no servidor por src/lib/saude-design.ts a partir de dados/saude/. Textos e abas: window.SW_CFG
// (src/config/temas/saude-design.json). A aba e o nível vêm do endereço da página do site (window.SW_PAGE).
(function(){
const H = window.SWH = {};
const Q = new URLSearchParams(location.search||location.hash.slice(1));
const PG = window.SW_PAGE||{};
const S = {p:PG.p||'geral', lv:PG.lv||'BR', v:Q.get('v')||'', u:Q.get('u')||Q.get('m')||'', d:Q.get('d')||'', m:''};
const D = () => window.SW_SAUDE;
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
const fq = f => `<span class="freq${f==='aovivo'?' live':''}" title="Frequência de atualização">${FQ[f]}</span>`;
const prel = () => `<span class="freq prel" title="O período mais recente ainda recebe registros e pode mudar">Preliminar</span>`;
const stamp = (src,ref,f,o={}) => `<div class="stamp">${fq(f)}${o.est?fq('estimativa'):''}${o.prel?prel():''}<span>${esc(C.src[src]||src)}${ref?' '+ref:''}${D().datas[src]?' · '+D().datas[src]:''}</span></div>`;
// "Em breve": abas e linhas que ainda não têm dado no site (a fonte prevista aparece no texto).
const soonBox = (t,txt) => sit('soon',t,txt);
const mstamp = (m,o={}) => stamp(m.src,m.ref,m.f,Object.assign({prel:m.prel},o));
const note = html => `<p class="mnote"><em class="i" aria-hidden="true">i</em><span>${html}</span></p>`;
H.stamp = stamp;

/* ---------- valores reais (window.SW_SAUDE) ---------- */
// V(lugar, medida): o número do lugar ("__BR" = país, "__p" = o estado nas páginas do estado), ou null = sem dado.
const V = (id,key) => { const r=D().v[id]; if(!r) return null; const x=r[key]; return x==null?null:x; };
const isNd = (id,key) => V(id,key)==null;
// Formato pelo modelo do design (ph): "000,0" = 1 casa decimal; "R$ 0.000" = reais sem decimal; "00,0%" = porcentagem.
const fmtPh = (ph,v) => { if(v==null) return 'sem dado'; const dec=((ph.split(',')[1]||'').match(/0/g)||[]).length; return (ph.startsWith('R$')?'R$ ':'')+SW.num(v,dec)+(ph.endsWith('%')?'%':''); };
const fmt = (m,v) => fmtPh(m.ph,v);
const pct = (v,dec=0) => v==null?'sem dado':SW.num(v,dec)+'%';
const int = v => v==null?'sem dado':SW.num(v,0);
// 6 faixas com o mesmo número de lugares (quantis dos próprios dados), como nas páginas de estado do site.
const CUT={};
const cutsOf = k => { const key=L.key+k; if(CUT[key]) return CUT[key]; const m=C.measures[k];
  const a=L.ids.filter(id=>!(m&&L.flag(id,m)==='few')).map(id=>V(id,k)).filter(x=>x!=null).sort((x,y)=>x-y);
  const b=[];
  // Com muitos zeros (ex.: cidades sem leito de UTI), o zero é a 1ª faixa e as outras 5 dividem os valores acima de zero.
  const pos=a.filter(x=>x>0);
  if(a.length-pos.length>=a.length/6&&pos.length){ b.zero=true; b.push(pos[0]); for(let i=1;i<5;i++){ const q=pos[Math.min(pos.length-1,Math.floor(i*pos.length/5))]; if(q>b[b.length-1]) b.push(q); } }
  else for(let i=1;i<6;i++){ const q=a[Math.min(a.length-1,Math.floor(i*a.length/6))]; if(q!=null&&(!b.length||q>b[b.length-1])) b.push(q); }
  return CUT[key]=b; };
const clsOf = (k,v) => { if(v==null) return 0; const b=cutsOf(k); let c=0; b.forEach(x=>{ if(v>=x) c++; }); return Math.min(5,c); };
// Comprimento numa escala de 0 a hi (para trilhas e barras), em %.
const at = (v,hi) => v==null||!hi?0:Math.max(0,Math.min(100,v/hi*100));

/* ---------- nível: país por estado ou estado por município ---------- */
function mkLevel(){
  const sb = C.sub[S.lv];
  if(!sb){ const U=SW_DATA.UNITS, G=SW_GEO.states, units={};
    Object.keys(U).sort((a,b)=>U[a][0].localeCompare(U[b][0],'pt')).forEach(k=>units[k]={n:U[k][0],r:U[k][1],c:G[k].c});
    return {key:'BR',units,ids:Object.keys(units),regions:C.country.regions,regionLabel:C.country.regionLabel,Unit:C.country.Unit,unit:C.country.unit,units_:C.country.units,name:C.country.name,title:C.country.title,ramp:'r',parent:null,def:C.country.def,flag:()=>''}; }
  const G=SW_GEO_MUN, units={};
  // População dos nossos dados (IBGE, estimativa mais recente) no lugar da que veio com a malha do design.
  Object.keys(G.units).sort((a,b)=>G.units[a].n.localeCompare(G.units[b].n,'pt')).forEach(k=>{ const p=V(k,'pop'); units[k]=Object.assign({},G.units[k],p!=null?{p}:{}); });
  return {key:sb.key,sb,units,ids:Object.keys(units),regions:G.regions,regionLabel:sb.regionLabel,Unit:sb.Unit,unit:sb.unit,units_:sb.units,name:sb.name,title:sb.title,ramp:'g',parent:C.country.name,def:sb.def,
    flag:(id,m)=>{ const u=units[id]; if(!u||!m) return ''; const p=u.p||0; if(m.rare) return p<C.small.rare?'few':''; if(m.avg3){ if(p<C.small.few) return 'few'; if(p<C.small.avg3) return 'avg'; } return ''; }};
}
const pname = id => id==='__p'?L.name:(L.units[id]?L.units[id].n:id);
// lugares comparados: o escolhido, o estado (no nível municipal) e o país
const cmpOf = id => { const a=[]; if(id!=='__p') a.push({k:id,n:pname(id),c:L.key==='BR'?'pt':'pt f'}); if(L.parent) a.push({k:'__p',n:L.name,c:'rg'}); a.push({k:'__BR',n:C.country.name,c:'tk'}); return a; };
const cmpLegend = list => `<div class="lgd">${list.map(p=>`<span><i class="${p.c}"></i>${esc(p.n)}</span>`).join('')}</div>`;

/* ---------- endereços ---------- */
// Endereços do site (C.rotas). Aba sem página ainda = null (a navegação mostra "em breve").
const href = (k,o={}) => { if(C.links[k]) return C.links[k]; const lv=o.lv||S.lv, base=(C.rotas[lv]||{})[k]; if(!base) return null;
  const p=new URLSearchParams(); if(o.u) p.set(k==='ficha'?'m':'u',o.u); if(o.v) p.set('v',o.v); const s=p.toString(); return base+(s?'?'+s:''); };

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

const legend = (m,{nd=0,few=0,k}={}) => { const b=cutsOf(k), f=v=>fmt(m,v), sh=v=>f(v).replace('R$ ','');
  const labs=!b.length?[]:b.zero?['nenhum',...b.slice(1).map((x,i)=>`${sh(b[i])}–${sh(x)}`),`${sh(b[b.length-1])} ou mais`]:[`até ${f(b[0])}`,...b.slice(1).map((x,i)=>`${sh(b[i])}–${sh(x)}`),`${sh(b[b.length-1])} ou mais`];
  return `<div class="legend"><div class="ramp">${labs.map((l,i)=>`<div><i style="background:var(--${L.ramp}${i})"></i>${l}</div>`).join('')}</div>
  ${few?`<div class="lg-h lg-d"><i></i>Poucos casos (${few})</div>`:''}${nd?`<div class="lg-h"><i></i>Sem dado (${nd})</div>`:''}</div>
  <p class="srcnote" style="padding:6px 0 0">${b.zero?t2(`A primeira cor reúne os ${L.units_} sem nenhum; as outras, o mesmo número de ${L.units_} cada.`,'Zero na 1ª cor; as outras com o mesmo número de lugares.'):t2(`Cada cor reúne o mesmo número de ${L.units_}.`,'Cores com o mesmo número de lugares.')}</p>`; };

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
    const max=val.length?val[0].v:1, hiCi=Math.max(...val.map(r=>r.hi??r.v))||1;
    const row=r=>`<li data-u="${r.id}" role="option" tabindex="${r.id===st.sel?0:-1}" aria-selected="${r.id===st.sel}" class="${r.id===st.sel?'on':''} ${r.id===st.hov?'hv':''} ${r.few?'small':''}">
      <span class="n">${r.rank||'—'}</span><span class="nm">${esc(nm(r.id))}</span>
      <span class="bar ${r.nd?'h':''}">${r.nd||r.few?'':st.ci&&r.lo!=null?`<span class="trk" style="height:8px" title="Faixa provável: ${esc(r.ciTxt||'')}"><span class="ci" style="left:${at(r.lo,hiCi)}%;width:${at(r.hi,hiCi)-at(r.lo,hiCi)}%;height:6px;margin-top:-3px"></span><span class="pt" style="left:${at(r.v,hiCi)}%;width:8px;height:8px;margin:-4px 0 0 -4px;box-shadow:none"></span></span>`:`<i style="width:${Math.max(3,r.v/max*100)}%"></i>`}</span>
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
// Topo do eixo em número redondo (linhas de grade em 1, 2, 2,5 ou 5 × 10^n), para as marcas do eixo ficarem legíveis.
const niceTop=(v,n)=>{ const x=v*1.05/n, p=10**Math.floor(Math.log10(x)), f=x/p; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p*n; };
const CH=[]; const reg=(el,f)=>{ el._r=f; if(!CH.includes(el)) CH.push(el); f(); };
H.reflow=()=>CH.forEach(el=>el.isConnected&&el._r());
// linha: {n, series:[{n,vals,main}], xl(i), ticks:[i], bands:[{a,b,label}], prel, h, mini, aria, yl, tipx(i)}
function line(el,o){ reg(el,()=>{
  const W=Math.max(240,Math.round(el.clientWidth||600)), Hh=o.h||(MOB()?200:280), L0=2, R=o.mini?26:40, T=o.bands&&!o.mini?26:8, B=22, n=o.n;
  const hv0=Math.max(...o.series.flatMap(s=>s.vals.filter(v=>v!=null))), hi=niceTop(Number.isFinite(hv0)&&hv0>0?hv0:1,o.mini?2:4);
  const x=i=>L0+i/(n-1)*(W-L0-R), y=v=>T+(1-v/hi)*(Hh-T-B), st=(W-L0-R)/(n-1);
  let g=''; const gl=o.mini?2:4;
  const fy=o.fy||(v=>SW.num(v,v>=100?0:1)), ax=v=>SW.num(v,v%1===0?0:1);
  for(let j=0;j<=gl;j++){ const v=hi*j/gl; g+=`<line class="${j?'gl':'ax'}" x1="${L0}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${W-R+6}" y="${(y(v)+4).toFixed(1)}">${j?(o.fyAxis||ax)(v):'0'}</text>`; }
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
    tx[0].textContent=(o.tipx||o.xl)(i)+(i>pk?' · preliminar':''); o.series.forEach((s,k)=>tx[k+1].textContent=(o.series.length>1?s.n+': ':'')+(s.vals[i]==null?'sem dado':fy(s.vals[i])+(o.yu?' '+o.yu:''))); };
  svg.querySelector('.hit').onmouseleave=()=>hv.style.display='none';
});}
// colunas: {n, vals, band:[[lo,hi]], med, prel, xl, ticks, tipx, aria, h}
function cols(el,o){ reg(el,()=>{
  const W=Math.max(240,Math.round(el.clientWidth||600)), Hh=o.h||(MOB()?220:300), L0=2, R=40, T=8, B=22, n=o.n, id='pc'+(++mseq);
  const hi=niceTop(Math.max(...o.vals.filter(v=>v!=null),...(o.band||[]).map(b=>b[1]))||1,4), bw=(W-L0-R)/n, x=i=>L0+i*bw, y=v=>T+(1-v/hi)*(Hh-T-B);
  let g=`<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--sub);stroke-width:1.2"/></pattern></defs>`;
  const fy=o.fy||(v=>SW.num(v,v>=100?0:1));
  for(let j=0;j<=4;j++){ const v=hi*j/4; g+=`<line class="${j?'gl':'ax'}" x1="${L0}" x2="${W-R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${W-R+6}" y="${(y(v)+4).toFixed(1)}">${j?fy(v):'0'}</text>`; }
  if(o.band){ const up=o.band.map((b,i)=>`${(x(i)+bw/2).toFixed(1)} ${y(b[1]).toFixed(1)}`), dn=o.band.map((b,i)=>`${(x(i)+bw/2).toFixed(1)} ${y(b[0]).toFixed(1)}`).reverse(); g+=`<path class="area" d="M${up.join('L')}L${dn.join('L')}Z"/>`; }
  const k=o.vals.length, pk=k-(o.prel||0);
  o.vals.forEach((v,i)=>{ if(v==null) return; const p=i>=pk; g+=`<rect class="${p?'colp':'col'}" data-i="${i}" x="${(x(i)+bw*.15).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw*.7).toFixed(1)}" height="${(y(0)-y(v)).toFixed(1)}"/>`+(p?`<rect x="${(x(i)+bw*.15).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw*.7).toFixed(1)}" height="${(y(0)-y(v)).toFixed(1)}" fill="url(#${id})" style="pointer-events:none"/>`:''); });
  if(o.med) g+=`<path class="med" d="M${o.med.map((v,i)=>`${(x(i)+bw/2).toFixed(1)} ${y(v).toFixed(1)}`).join('L')}"/>`;
  (o.ticks||[0,n-1]).forEach((i,j,a)=>g+=`<text x="${(x(i)+bw/2).toFixed(1)}" y="${Hh-5}" text-anchor="${j===0?'start':j===a.length-1?'end':'middle'}">${o.xl(i)}</text>`);
  el.innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="${esc(o.aria||'Colunas')}">${g}<g class="tip" style="display:none;pointer-events:none"><rect rx="4" width="190" height="44"/><text class="t1" x="10" y="18" style="font-weight:600"></text><text class="t2" x="10" y="36"></text></g></svg>`;
  const svg=el.querySelector('svg'), tip=svg.querySelector('.tip');
  svg.onmousemove=e=>{ const r=e.target.closest('rect[data-i]'); if(!r){tip.style.display='none';return;} const i=+r.dataset.i; tip.style.display='';
    tip.setAttribute('transform',`translate(${x(i)>W-230?x(i)-195:x(i)+bw+4},${T+4})`); tip.querySelector('.t1').textContent=o.tipx(i)+(i>=pk?' · preliminar':''); tip.querySelector('.t2').textContent=o.vals[i]==null?'sem dado':fy(o.vals[i])+(o.yu?' '+o.yu:''); };
  svg.onmouseleave=()=>tip.style.display='none';
});}

/* ---------- formas em HTML ---------- */
// parts(base, contagens): cada parte com a sua % do total (contagens reais; nada inventado).
const parts = (base,cnt) => { const tot=base.reduce((s,b)=>s+(cnt&&cnt[b.k]||0),0); return base.map(b=>({...b,p:tot?(cnt[b.k]||0)/tot*100:0})); };
const segBg = c => c==='hatch'?'':`background:${c}`;
const pctTxt = p => p<1&&p>0?'menos de 1%':SW.num(p,0)+'%';
const b100 = (parts,o={}) => `<div class="b100 ${o.sm?'sm':''} ${o.dim?'dimmable':''}" role="img" aria-label="${esc(o.aria||'Barra que soma 100%')}">${parts.map(p=>`<i data-k="${p.k}" class="${p.c==='hatch'?'h':''}" style="width:${p.p.toFixed(2)}%;${segBg(p.c)}" title="${esc(p.s||p.n)}: ${pctTxt(p.p)}"></i>`).join('')}</div>`;
const keys = (parts,o={}) => `<div class="keys" ${o.id?`id="${o.id}"`:''}>${parts.map(p=>`<div class="key" data-k="${p.k}"><i class="${p.c==='hatch'?'hatch':''}" style="${segBg(p.c)};${p.c==='hatch'?'box-shadow:inset 0 0 0 1px var(--line2)':''}"></i><span>${esc(o.long?p.n:(p.s||p.n))}</span>${o.noval||p.p==null?'':`<em>${pctTxt(p.p)}</em>`}</div>`).join('')}</div>`;
const bindKeys = root => { root.querySelectorAll('.key').forEach(k=>{ k.onmouseenter=()=>{ root.querySelectorAll('.dimmable').forEach(b=>{b.classList.add('dim'); b.querySelectorAll('i').forEach(i=>i.classList.toggle('hi',i.dataset.k===k.dataset.k));}); k.classList.add('on'); };
  k.onmouseleave=()=>{ root.querySelectorAll('.dimmable').forEach(b=>b.classList.remove('dim')); k.classList.remove('on'); }; }); };
// trk(lugares, get, o): pontos de cada lugar numa trilha de 0 a o.hi. get(p) = número ou {v, lo, hi} (faixa da margem).
const trk = (list,get,o={}) => { const vals=list.map(p=>{ const x=get(p); return x==null?null:typeof x==='number'?{v:x}:x; });
  const hi=o.hi||Math.max(...vals.filter(Boolean).map(x=>x.hi??x.v),0)*1.25||1;
  return `<span class="trk" aria-hidden="true">${o.goal!=null?`<span class="goal" style="left:${at(o.goal,hi)}%"></span>`:''}${list.map((p,i)=>[p,vals[i]]).reverse().map(([p,x])=>{ if(!x||x.v==null) return '';
  return (o.ci&&x.lo!=null?`<span class="ci" style="left:${at(x.lo,hi)}%;width:${at(x.hi,hi)-at(x.lo,hi)}%"></span>`:'')+`<span class="${p.c}" style="left:${at(x.v,hi).toFixed(1)}%"></span>`; }).join('')}</span>`; };
const sit = (kind,title,text) => { const sw=kind==='state'?'background:var(--r2)':kind==='soon'?'background:var(--track)':'';
  return `<div class="sit" role="note"><i class="sw ${kind==='nodata'?'hatch':''}" style="${sw}"></i><div><h3>${title}</h3><p>${text}</p></div></div>`; };
const placeSel = (id,cur,label='Lugar') => `<label class="fld"><span>${label}</span><select id="${id}"><option value="__p" ${cur==='__p'?'selected':''}>${esc(L.name)}${L.parent?' (estado)':''}</option>${L.ids.map(k=>`<option value="${k}" ${k===cur?'selected':''}>${esc(L.units[k].n)}</option>`).join('')}</select></label>`;
const startPlace = () => (S.u&&L.units[S.u])?S.u:L.def;

/* ---------- séries por ano (dados reais) ---------- */
const Y0=()=>D().anos[0], Y1=()=>D().anos[D().anos.length-1], NY=()=>D().anos.length;
const pandA=()=>2020-Y0();
const ser=(k,place)=>{ const r=D().v[place]; return (r&&r.ser&&r.ser[k])||D().anos.map(()=>null); };
// Linha por ano. Começa no primeiro ano com dado (nos municípios, a série é mais curta).
const yrsLine=(el,list,k,o={})=>{ const series=list.map((p,i)=>({n:p.n,main:i===0,vals:ser(k,p.k)}));
  let a=0; while(a<NY()-1&&series.every(s=>s.vals[a]==null)) a++;
  const n=NY()-a, sl=series.map(s=>({...s,vals:s.vals.slice(a)})), pa=pandA()-a;
  const tk=n<=5?[...Array(n).keys()]:MOB()?[0,Math.round((n-1)/2),n-1]:[0,2,4,6,8,10].filter(i=>i<n-1).concat(n-1);
  const bands=(o.bands||[{a:pandA(),b:pandA()+1,label:t2('Pandemia de covid-19','Pandemia')}]).map(b=>({...b,a:b.a-a,b:b.b-a})).filter(b=>b.b>=0).map(b=>({...b,a:Math.max(0,b.a)}));
  return line(el,Object.assign({n,series:sl,xl:i=>String(Y0()+a+i),ticks:[...new Set(tk)],prel:C.years.prel},o,{bands})); };

/* ---------- página ---------- */
const setFlag=()=>{ const sb=L.sb; if(sb&&sb.flag) document.documentElement.style.setProperty('--flag',sb.flag[SW.theme()]||sb.flag.light); };
function shell(){
  const T=C.TABS.map(g=>({...g,items:g.items.map(([k,n])=>[k,k==='expvida'?`${n}${OUT}`:n])})), lab=(T.flatMap(g=>g.items).find(i=>i[0]===S.p)||[])[1];
  // O cabeçalho (temas, tema claro/escuro) é o do site (Base.astro); aqui só a cor da bandeira acompanha o tema.
  SW.onTheme.push(setFlag); setFlag();
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
H.mount=()=>{ C=window.SW_CFG; L=mkLevel();
  // Período de referência de cada medida: o dos nossos arquivos (não o do design).
  const R=D().refs; Object.values(C.measures).forEach(m=>{ if(m.src==='cnes') m.ref=R.cnes; else if(m.src==='ans') m.ref=R.ans; });
  C.measures.mort.ref=C.measures.inf.ref=String(D().final); C.measures.mort.h=`Mortes por 100 mil habitantes em ${D().final}`; C.measures.inf.h=`Mortalidade infantil em ${D().final}`;
  C.measures.mat.ref=`${D().final-2}–${D().final}`; C.measures.mat.h=`Mortalidade materna, média de ${D().final-2} a ${D().final}`;
  C.years={first:Y0(),last:Y1(),prel:Y1()>D().final?1:0,final:D().final};
  shell(); (TAB[S.p]||TAB.geral)();
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
    rows=L.ids.map(id=>{ const fl=L.flag(id,m), v=V(id,st.m), r={id,v,nd:v==null,few:fl==='few',avg:fl==='avg',txt:fmt(m,v)};
      if(m.rare){ r.lo=V(id,'matLo'); r.hi=V(id,'matHi'); r.ciTxt=r.lo!=null?`${fmt(m,r.lo)} a ${fmt(m,r.hi)}`:''; } return r; });
    map.update(id=>{ const r=rows.find(x=>x.id===id); return {k:clsOf(st.m,r.v),nd:r.nd,few:r.few}; });
    $('legend').innerHTML=legend(m,{k:st.m,nd:rows.filter(r=>r.nd).length,few:rows.filter(r=>r.few&&!r.nd).length});
    draw(); o.onSel&&o.onSel(st); };
  const draw=()=>{ const m=C.measures[st.m], show=st.hov||st.sel, u=L.units[show], r=rows.find(x=>x.id===show)||{};
    map.mark(st.sel,st.hov);
    const facts=(o.facts||[]).filter(k=>k!==st.m).map(k=>{const f=C.measures[k], fl=L.flag(show,f); return `<div class="fact"><span>${f.long}</span><b>${fl==='few'?'poucos casos':fmt(f,V(show,k))}</b></div>`;}).join('');
    const big=r.nd?`<div class="nodata"><i class="sw-h"></i>Sem dado para este ${L.unit}</div>`:r.few?`<div class="nodata"><i class="sw-h dots" style="background-color:transparent"></i>Poucos casos para comparar</div>`:`<div class="big">${fmt(m,r.v).replace(/^R\$ /,'R$&nbsp;')}<small>${m.unit}</small></div>`+(r.lo!=null?`<div class="line" style="color:var(--sub);font-size:14px">Faixa provável: ${r.ciTxt} (${int(V(show,'matN'))} mortes em 3 anos)</div>`:'');
    const sub=C.sub[show];
    const link=L.key==='BR'?(sub?`<a class="lnk" href="${href(S.p,{lv:sub.key})}">Ver os ${sub.units} de ${sub.name} ${ARW}</a>`:`<span class="line" style="color:var(--sub)">Municípios de ${esc(u.n)} <em class="soon">em breve</em></span>`)
      :`<a class="lnk" href="${href('ficha',{u:show})}">Abrir a ficha de saúde de ${esc(u.n)} ${ARW}</a>`;
    $('card').innerHTML=`<div class="card" aria-live="polite"><div class="meta">${L.key==='BR'?u.r:`${L.regionLabel} de ${esc(u.r)}`}</div>
      <div class="nm">${esc(u.n)}</div>${big}
      ${r.avg?`<div class="line" style="color:var(--sub);font-size:14px">Média de 3 anos: o município tem menos de ${SW.num(C.small.avg3/1000,0)} mil habitantes.</div>`:''}
      ${r.few?`<div class="line" style="color:var(--sub);font-size:14px">Com tão poucos casos por ano, a taxa muda muito de um ano para outro. Compare com ${L.name}: ${fmt(m,V('__p',st.m))}.</div>`:''}
      <div class="facts">${L.parent?`<div class="fact"><span>${L.name}</span><b>${fmt(m,V('__p',st.m))}</b></div>`:''}<div class="fact"><span>${C.country.name}</span><b>${fmt(m,V('__BR',st.m))}</b></div>${facts}</div>
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
// Abas que o design desenhou mas que ainda não têm dado no site.
const soonTab=k=>()=>{ $('body').innerHTML=`<div style="margin-top:24px">${soonBox('Em breve',`Esta parte ainda não tem dado no StatWorld. Fonte prevista: ${esc(C.emBreve[k]||'a definir')}.`)}</div>`; };
['vac','doencas','sus','gasto'].forEach(k=>TAB[k]=soonTab(k));
const n1=v=>v==null?'sem dado':SW.num(v,1);

TAB.obitos=()=>{
  const views=[['causa','Por causa'],['idade',t2('Por idade e sexo','Idade e sexo')],['tempo',t2('Ao longo do tempo','No tempo')]];
  const st={v:views.some(v=>v[0]===S.v)?S.v:'causa', pl:startPlace()};
  $('body').innerHTML=`${viewSeg()}<div class="ctrl2">${placeSel('pl',st.pl)}</div><div id="ob"></div>`;
  bindViews(views,st.v,k=>{st.v=k;render();}); $('pl').onchange=e=>{st.pl=e.target.value;render();};
  const m=C.measures.mort, few=()=>L.flag(st.pl,m)==='few', avg=()=>L.flag(st.pl,m)==='avg', F=C.years.final;
  const what=()=>`<aside class="what"><h3>O que estes números medem</h3>
      <div class="kv"><b>${int(V(st.pl,'obitos'))}</b><span>mortes de moradores de ${esc(pname(st.pl))} em ${F}</span></div>${stamp('sim',String(F),'anual')}
      <p>Cada morte é contada pela causa básica escrita na declaração de óbito e agrupada pelos capítulos da CID-10, a classificação internacional de doenças.</p>
      <p class="s">As taxas por causa são brutas: mortes divididas pela população. Lugares com mais idosos têm taxa bruta maior. Para comparar lugares, use a taxa de todas as causas padronizada por idade, na Visão geral.</p>
      <p class="s">${esc(C.notaCovid)}</p>
      <p class="s">A parte de causas mal definidas indica a qualidade do registro: quanto maior, menos se sabe sobre a causa.</p>
      <p class="s">${C.years.last} ainda é preliminar: os registros continuam chegando. Por isso esta vista mostra ${F}.</p></aside>`;
  const render=()=>{ const list=cmpOf(st.pl), pn=esc(pname(st.pl)), E=$('ob');
    if(st.v==='causa'){ const sh=list.map(p=>{ const c=(p.k===st.pl&&(few()||avg()))?V(p.k,'causas3'):V(p.k,'causas'); return {p,c,parts:parts(C.causes,c)}; });
      const tot=c=>c?Object.values(c).reduce((s,x)=>s+x,0):null;
      const rows=C.causes.filter(c=>!c.quality).map(c=>({c,get:p=>{ const b=V(p.k,'bruta'); return b?b[c.k]:null; }}));
      E.innerHTML=`<div class="two"><div>
        <div class="vh"><div><h2>${t2(`De que se morre em ${pn}`,`Causas de morte, ${pn}`)}</h2><p>${t2(`Cada 100 mortes em ${F}, por grupo de causas, e a taxa de cada grupo comparada com ${L.parent?`${esc(L.name)} e o ${C.country.name}`:`o ${C.country.name}`}.`,`Cada 100 mortes em ${F}.`)}</p></div></div>
        <div class="blk" style="margin-top:20px"><h3 class="sec-h" style="margin-bottom:12px">Cada 100 mortes${few()||avg()?`, soma de ${F-2} a ${F} em ${pn}`:''}</h3>
          <div style="display:grid;gap:12px">${sh.map(({p,c,parts})=>`<div class="b100-r"><div><b>${esc(p.n)}</b><span>${p.k===st.pl?`${int(tot(c))} mortes`:''}</span></div>${c?b100(parts,{dim:true,aria:`Cada 100 mortes em ${p.n}`}):'<span class="nd">sem dado</span>'}</div>`).join('')}</div>
          ${keys(sh[0].parts)}</div>
        <div class="blk"><h3 class="sec-h">Mortes por 100 mil habitantes, bruta, sem padronizar</h3>
          ${few()?`<div style="margin-top:12px">${sit('few','Poucos casos para comparar',`${pn} tem menos de ${SW.num(C.small.few/1000,0)} mil habitantes. Com tão poucas mortes por ano, as taxas por causa mudam muito de um ano para outro. Use as partes acima, que somam três anos, ou compare com ${esc(L.name)}.`)}</div>`:
          `${cmpLegend(list)}${avg()?`<p class="srcnote" style="padding:6px 0 0">Média de 3 anos, de ${F-2} a ${F}: o município tem menos de ${SW.num(C.small.avg3/1000,0)} mil habitantes.</p>`:''}
          <div class="dm-h" style="margin-top:16px"><span>Causa</span><span></span><span style="text-align:right">${esc(pname(st.pl)).slice(0,14)}</span><span style="text-align:right">${C.country.name}</span></div>
          <ul class="dm">${rows.map(({c,get})=>`<li><span class="nm"><i style="background:${c.c}"></i><span>${esc(c.s)}<small>CID-10 ${c.cid}</small></span></span>${trk(list,get)}<span class="v">${n1(get({k:st.pl}))}</span><span class="v s">${n1(get({k:'__BR'}))}</span></li>`).join('')}</ul>`}
        </div></div>${what()}</div>`;
      bindKeys(E); }
    else if(st.v==='idade'){
      E.innerHTML=`<div class="two"><div><div style="margin-top:24px">${soonBox('Por idade e sexo: em breve',`O SIM tem as mortes de cada causa por idade e sexo. A conta para ${pn} ainda está sendo preparada; enquanto isso, veja a vista Por causa.`)}</div></div>${what()}</div>`; }
    else { const cs=C.causes.filter(c=>c.k!=='out');
      E.innerHTML=`<div class="vh"><div><h2>${t2(`As causas de morte de ${Y0()} a ${Y1()}`,`Causas de morte no tempo`)}</h2><p>${t2(`Todas as causas: mortes por 100 mil habitantes padronizadas por idade. Cada causa: taxa bruta. Em ${list.map(p=>esc(p.n)).join(', ').replace(/, ([^,]*)$/,' e $1')}. O trecho tracejado é preliminar.`,`Por 100 mil habitantes.`)}</p></div>${stamp('sim',`${Y0()}–${Y1()}`,'anual',{prel:true})}</div>
        ${cmpLegend(list).replace('<div class="lgd">','<div class="lgd"><span><i class="ln d"></i>Preliminar</span><span><i class="bd"></i>Pandemia de covid-19</span>').replace(/<i class="pt[^"]*"><\/i>/,'<i class="ln"></i>').replace(/<i class="rg"><\/i>/,'<i class="ln s"></i>').replace(/<i class="tk"><\/i>/,'<i class="ln s" style="opacity:.55"></i>')}
        <div class="blk" style="margin-top:20px"><h3 class="sec-h" style="margin-bottom:8px">Todas as causas, padronizada por idade</h3><div id="tall"></div></div>
        ${few()||avg()?note(`${pn} tem poucas mortes por ano: as linhas mudam muito de um ano para outro.`):''}
        <div class="mult">${cs.map(c=>`<div><h4><i class="${c.c==='hatch'?'hatch':''}" style="${segBg(c.c)}"></i>${esc(c.s)}</h4><small>CID-10 ${c.cid}</small><div id="sm-${c.k}" style="margin-top:6px"></div></div>`).join('')}</div>`;
      yrsLine($('tall'),list,'mort',{aria:'Todas as causas, mortes por 100 mil habitantes padronizadas por idade',h:MOB()?200:260,yu:'por 100 mil'});
      cs.forEach(c=>yrsLine($('sm-'+c.k),[list[0],list[list.length-1]],c.k,{mini:true,h:120,ticks:[0,NY()-1],aria:c.n,yu:'por 100 mil'})); }
  };
  render();
};

TAB.infantil=()=>{
  const views=[['inf','Infantil'],['mat','Materna']], cur=views.some(v=>v[0]===S.v)?S.v:'inf';
  mapTab({measures:['inf','mat'],cur,facts:['inf','mat'],below:true,onSel:st=>{ const list=cmpOf(st.sel), m=C.measures[st.m];
    $('below').innerHTML=`<div class="vh"><div><h2>${t2(`${m.l} ano a ano`,`${m.l} no tempo`)}</h2><p>${m.unit[0].toUpperCase()+m.unit.slice(1)}, em ${list.map(p=>esc(p.n)).join(' e ')}, cada ano separado${st.m==='mat'?' (por ano a taxa materna oscila mais que a média de 3 anos do mapa)':''}.</p></div></div>
      <div class="lgd"><span><i class="ln"></i>${esc(list[0].n)}</span>${list.slice(1).map(p=>`<span><i class="ln s"></i>${esc(p.n)}</span>`).join('')}<span><i class="ln d"></i>Preliminar</span></div><div id="tl" style="margin-top:8px"></div>`;
    yrsLine($('tl'),list,st.m,{aria:`${m.long}, ano a ano`,yu:m.unit,bands:st.m==='mat'?undefined:[]}); }});
};

TAB.nasc=()=>{
  const st={pl:startPlace()};
  $('body').innerHTML=`<div class="ctrl2" style="margin-top:24px">${placeSel('pl',st.pl)}</div><div id="nb"></div>`;
  $('pl').onchange=e=>{st.pl=e.target.value;render();};
  const render=()=>{ const list=cmpOf(st.pl), pn=esc(pname(st.pl)), few=L.flag(st.pl,{avg3:true})==='few', F=C.years.final;
    $('nb').innerHTML=`<div class="vh" style="margin-top:28px"><div><h2>${t2(`Cada 100 bebês nascidos em ${pn}`,`Cada 100 bebês, ${pn}`)}</h2><p>${t2(`Nascidos vivos de mães que moram em ${pn}, em ${F}. Um quadrado é um bebê em cada 100.`,`Um quadrado é um bebê em cada 100.`)}</p></div>${stamp('sinasc',String(F),'anual')}</div>
      <div class="kv" style="margin-top:16px"><b>${int(V(st.pl,'nasc'))}</b><span>nascidos vivos em ${F}</span></div>
      ${few?note(`${pn} tem poucos nascimentos por ano: estas partes mudam muito de um ano para outro.`):''}
      <div class="c100">${C.births.map(b=>{ const val=V(st.pl,b.k), on=val==null?0:Math.round(val); return `<div><h3>${b.t}</h3>
        <div class="wf" role="img" aria-label="${esc(b.t)}: ${val==null?'sem dado':SW.num(val,0)+' em cada 100'}">${Array.from({length:100},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('')}</div>
        <div class="n"><b>${val==null?'—':SW.num(val,0)}</b><span>em cada 100</span></div>
        <div class="cmp">${list.slice(1).map(p=>`${esc(p.n)}: <b>${V(p.k,b.k)==null?'—':SW.num(V(p.k,b.k),0)}</b>`).join(' · ')}</div><p>${b.d}</p></div>`; }).join('')}</div>
      <div class="blk"><div class="vh"><div><h2>${t2('Nascidos vivos por ano','Nascidos vivos por ano')}</h2><p>Total de nascidos vivos de mães que moram em ${pn}.</p></div>${stamp('sinasc',`${Y0()}–${Y1()}`,'anual',{prel:true})}</div><div id="bl" style="margin-top:12px"></div></div>`;
    yrsLine($('bl'),[list[0]],'births',{aria:'Nascidos vivos por ano',bands:[],fy:v=>SW.num(Math.round(v),0),yu:'nascidos vivos'}); };
  render();
};

// Pesquisa Nacional de Saúde: só país e estados. "__p" e "__BR" = o país no nível Brasil.
const pnsOf=(pk,id,sx='total')=>{ const a=D().pns[id]; if(!a) return null; const k=pk==='__BR'||(pk==='__p'&&L.key==='BR')?'BR':pk==='__p'?L.key:pk; const x=a[k]&&a[k][sx]; return x&&x.pct!=null?{v:x.pct,lo:x.inf,hi:x.sup}:null; };
TAB.pns=()=>{
  const views=[['self','Saúde autoavaliada'],['chronic',t2('Doenças crônicas','Crônicas')],['habits','Hábitos']], P=C.pns;
  const st={v:views.some(v=>v[0]===S.v)?S.v:'self', pl:L.key==='BR'?startPlace():'__p'};
  const stateOnly=L.key!=='BR';
  $('body').innerHTML=`${viewSeg()}${stateOnly?`<div style="margin-top:24px">${sit('state','Só o número do estado',`A Pesquisa Nacional de Saúde entrevista uma amostra de moradores que representa o ${C.country.name} e cada estado, não cada município. Por isso esta aba mostra ${esc(L.name)} inteiro.`)}</div>`:`<div class="ctrl2">${placeSel('pl',st.pl)}</div>`}<div id="pb"></div>`;
  bindViews(views,st.v,k=>{st.v=k;render();}); if(!stateOnly) $('pl').onchange=e=>{st.pl=e.target.value;render();};
  const render=()=>{ const pn=esc(stateOnly?L.name:pname(st.pl)), pk=stateOnly?'__p':st.pl, isBR=pk==='__p'&&!stateOnly, list=stateOnly?[{k:'__p',n:L.name,c:'pt'},{k:'__BR',n:C.country.name,c:'tk'}]:isBR?[{k:'__BR',n:C.country.name,c:'tk'}]:cmpOf(st.pl).map(p=>p.c==='rg'?{...p,c:'tk'}:p);
    const what=`<aside class="what"><h3>De onde vêm estes números</h3><p>Da Pesquisa Nacional de Saúde, feita em casa com moradores de 18 anos ou mais. A pessoa responde sobre a própria saúde.</p>
      <p class="s">Por ser uma amostra, cada número tem uma margem. A barra clara mostra a faixa em que o valor real deve estar (intervalo de 95% publicado pelo IBGE).</p>${stamp('pns',P.year,'estimativa',{})}<p class="s">A pesquisa é feita a cada cinco ou seis anos. Só existe para o ${C.country.name} e os estados.</p></aside>`;
    if(st.v==='self'){ const sc=P.self.map(([n,c],i)=>({k:'s'+i,n,s:n,c}));
      const bar=(k,sx)=>{ const x=pnsOf(k,P.selfId,sx); return x?sc.map((s,i)=>({...s,p:i===0?x.v:100-x.v})):null; };
      const rows=[[pn,pk,'total'],...(isBR?[]:[[C.country.name,'__BR','total']]),...P.groups.slice(1).map(([g,sx])=>[`${g}, ${pn}`,pk,sx])];
      const first=bar(pk,'total');
      $('pb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${t2(`Como as pessoas de ${pn} dizem que está a própria saúde`,`Saúde autoavaliada, ${pn}`)}</h2><p>${t2(`Resposta à pergunta “Em geral, como você avalia a sua saúde?”, em ${P.year}. Cada barra soma 100% das pessoas do grupo.`,`Cada barra soma 100%.`)}</p></div></div>
        ${keys(first||sc)}<div style="display:grid;gap:14px;margin-top:20px">${rows.map(([n,k,sx],i)=>{ const b=bar(k,sx), x=pnsOf(k,P.selfId,sx); return `${i===(isBR?1:2)?`<h3 class="sec-h" style="margin-top:12px">Por sexo, ${pn}</h3>`:''}<div class="b100-r"><div><b style="${i>(isBR?0:1)?'font-weight:500':''}">${n.replace(`, ${pn}`,'')}</b><span>${x?`margem: ${SW.num(x.lo,1)}% a ${SW.num(x.hi,1)}%`:''}</span></div>${b?b100(b,{dim:true,aria:n}):'<span class="nd">sem dado</span>'}</div>`; }).join('')}</div>
        <p class="srcnote" style="padding:10px 0 0">A pesquisa publica por estado a parte que avalia a saúde como boa ou muito boa; as outras respostas aparecem juntas.</p></div>${what}</div>`;
      bindKeys($('pb')); }
    else { const it=st.v==='chronic'?P.chronic:P.habits;
      const hi=Math.ceil(Math.max(...it.flatMap(([id])=>list.map(p=>(pnsOf(p.k,id)||{}).hi||0)))*1.1/10)*10||100;
      $('pb').innerHTML=`<div class="two"><div><div class="vh"><div><h2>${st.v==='chronic'?t2(`Doenças crônicas em ${pn}`,`Doenças crônicas, ${pn}`):t2(`Hábitos em ${pn}`,`Hábitos, ${pn}`)}</h2><p>${t2(`Parte das pessoas de 18 anos ou mais, em ${P.year}, com a faixa da margem da pesquisa. A trilha vai de 0 a ${hi}%.`,`% das pessoas de 18 anos ou mais.`)}</p></div></div>
        <div class="lgd">${list.map(p=>`<span><i class="${p.c}"></i>${esc(p.n)}</span>`).join('')}<span><i class="ci"></i>Margem da pesquisa</span></div>
        <div class="dm-h" style="margin-top:16px"><span>${st.v==='chronic'?'Doença':'Hábito'}</span><span></span><span style="text-align:right">${pn.slice(0,14)}</span><span style="text-align:right">${C.country.name}</span></div>
        <ul class="dm">${it.map(([id,n,d])=>`<li><span class="nm"><span>${n}<small>${d}</small></span></span>${trk(list,p=>pnsOf(p.k,id),{ci:true,hi})}<span class="v">${pct((pnsOf(pk,id)||{}).v,1)}</span><span class="v s">${pct((pnsOf('__BR',id)||{}).v,1)}</span></li>`).join('')}</ul></div>${what}</div>`; }
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
  $('tb').innerHTML=`<div style="margin-top:24px">${soonBox('Tempo até o hospital: em breve',`A conta do tempo de carro até o hospital com leitos mais próximo (com a grade de população do Censo e o endereço dos hospitais no CNES) ainda está sendo feita e conferida.`)}</div>`;
}

TAB.planos=()=>mapTab({measures:['planos'],cur:'planos',facts:[],
  side:id=>{ const val=V(id,'planos'), on=val==null?0:Math.round(Math.min(100,val)); return `<div class="card"><div class="meta">Cada 100 pessoas em ${esc(L.units[id].n)}</div>
    <div class="wf c100" style="display:grid;grid-template-columns:repeat(20,minmax(0,1fr));gap:3px;margin-top:10px;max-width:none" role="img" aria-label="${val==null?'sem dado':SW.num(on,0)+' em cada 100 têm plano de saúde'}">${Array.from({length:100},(_,i)=>`<i style="aspect-ratio:1;display:block;border-radius:1px;background:${i<on?'var(--accent)':'var(--track)'}"></i>`).join('')}</div>
    <div class="line"><b style="font-size:22px">${val==null?'—':SW.num(on,0)}</b> têm plano de assistência médica</div><div class="line" style="color:var(--sub);font-size:14px">${int(V(id,'beneficiarios'))} beneficiários</div><div style="margin-top:4px">${stamp('ans',D().refs.ans,'mensal')}</div></div>`; }});

/* ---------- ficha do município ---------- */
const fichaId=()=>(S.u&&L.units[S.u])?S.u:(L.sb&&L.sb.ficha&&L.units[L.sb.ficha]?L.sb.ficha:L.def);
TAB.ficha=()=>{
  const id=fichaId(), u=L.units[id], list=cmpOf(id), M=C.measures, yr=String(C.years.final);
  const R=(o)=>o; const sn=(l,what)=>({l,what,sit:'soon'});
  const FICHA=[
   {k:'vida',g:'Nascer e morrer',rows:[R({m:'mort'}),R({m:'inf'}),R({m:'mat'}),{k:'nasc',l:'Nascidos vivos',what:'Bebês nascidos vivos de mães que moram aqui.',ph:'0',unit:'em '+yr,src:'sinasc',ref:yr,f:'anual',nocmp:true},
     {k:'pre',l:'Pré-natal com 7 ou mais consultas',what:'Parte dos nascidos vivos cujas mães fizeram 7 consultas ou mais.',ph:'0,0%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {k:'ces',l:'Partos cesáreos',what:'Parte dos nascidos vivos que nasceram de cesárea.',ph:'0,0%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {k:'ado',l:'Mães com até 19 anos',what:'Parte dos nascidos vivos de mães com até 19 anos.',ph:'0,0%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {k:'bp',l:'Baixo peso ao nascer',what:'Parte dos bebês que nasceram com menos de 2,5 kg.',ph:'0,0%',unit:'dos nascidos',src:'sinasc',ref:yr,f:'anual'},
     {l:'Esperança de vida ao nascer',what:'Já está no tema Demografia.',link:C.links.expvida}]},
   {k:'prev',g:'Prevenção e hábitos',rows:[sn('Vacinação infantil','Cobertura das vacinas do calendário até 1 ano (SI-PNI).'),sn('Dengue','Casos prováveis por 100 mil habitantes (SINAN).'),sn('Tuberculose','Casos novos por 100 mil habitantes (SINAN).'),
     {pns:'autoavaliacao-boa',l:'Saúde boa ou muito boa',what:'Pessoas de 18 anos ou mais que avaliam a própria saúde como boa ou muito boa.',src:'pns',ref:C.pns.year,f:'estimativa',sit:'state'},
     {pns:'fumam',l:'Fumam',what:'Pessoas de 18 anos ou mais que fumam cigarro ou outro produto do tabaco.',src:'pns',ref:C.pns.year,f:'estimativa',sit:'state'}]},
   {k:'cuid',g:'Atendimento',rows:[R({m:'med'}),R({m:'enf'}),R({m:'leitos'}),R({m:'uti'}),sn('Internações no SUS','Internações de moradores, pagas pelo SUS, por mil habitantes (SIH/SUS).'),
     sn('Internados no próprio município','Parte das internações de moradores feitas em hospital daqui (SIH/SUS).'),sn('Consultas e exames no SUS','Procedimentos ambulatoriais por habitante (SIA/SUS).'),
     sn('Tempo até o hospital mais perto','A conta ainda está sendo feita e conferida.')]},
   {k:'rec',g:'Gasto e planos',rows:[sn('Gasto público em saúde por habitante','Quanto União, estado e município gastaram com saúde no lugar (SIOPS).'),R({m:'planos'})]}];
  // Partes dos nascidos (pré-natal, cesáreas...) também seguem a regra dos poucos casos.
  const row=r=>{ const m=r.m?{...M[r.m],l:M[r.m].long}:r, fl=r.m?L.flag(id,M[r.m]):(r.src==='sinasc'&&!r.nocmp&&L.flag(id,{avg3:true})==='few'?'few':''), lab=`<div class="l"><b>${m.l}</b>${r.m?'':`<p>${m.what}</p>`}${m.src?stamp(m.src,m.ref,m.f==='estimativa'?'anual':m.f,{prel:m.prel,est:m.f==='estimativa'}):''}</div>`;
    const ml=t=>`<span class="ml" style="font-size:12px;color:var(--faint)">${t}</span>`;
    if(r.link) return `<div class="fr">${lab}<div class="m" style="grid-column:span 4;text-align:left"><a class="lnk" href="${r.link}">Ver em Demografia ${OUT}</a></div></div>`;
    if(r.sit==='soon') return `<div class="fr">${lab}<div class="m"><span class="nd"><i style="background:var(--track)"></i>em breve</span></div><div class="e">${ml(L.name)}<span class="nd">em breve</span></div><div class="p">${ml(C.country.name)}<span class="nd">em breve</span></div><span></span></div>`;
    if(r.sit==='state'){ const e=pnsOf('__p',r.pns), b=pnsOf('__BR',r.pns);
      return `<div class="fr">${lab}<div class="m">${ml('Município')}<span class="nd"><i style="background:var(--r2)"></i>só o número do estado</span></div><div class="e">${ml(L.name)}<b style="font-weight:600">${pct(e&&e.v,1)}</b></div><div class="p">${ml(C.country.name)}${pct(b&&b.v,1)}</div>${trk(list.filter(p=>p.c!=='pt f'),p=>pnsOf(p.k,r.pns),{ci:true})}</div>`; }
    const get=p=>r.m==='mat'?{v:V(p.k,'mat'),lo:V(p.k,'matLo'),hi:V(p.k,'matHi')}:V(p.k,r.m||r.k), val=x=>fmt(m,x&&typeof x==='object'?x.v:x);
    const mine=get({k:id}), big=fl==='few'?`<span class="nd"><i class="dots"></i>poucos casos</span>`:(mine==null||(typeof mine==='object'&&mine.v==null))?`<span class="nd"><i class="sw-h"></i>sem dado</span>`:`<b>${val(mine)}</b><small>${fl==='avg'?'média de 3 anos':m.unit}</small>`;
    return `<div class="fr">${lab}<div class="m">${ml(esc(u.n))}${big}</div><div class="e">${ml(L.name)}${r.nocmp?'<span style="color:var(--faint)">—</span>':val(get({k:'__p'}))}</div><div class="p">${ml(C.country.name)}${r.nocmp?'<span style="color:var(--faint)">—</span>':val(get({k:'__BR'}))}</div>${r.nocmp||fl==='few'?'<span></span>':trk(list,get,{goal:r.goal,ci:r.m==='mat'})}</div>`; };
  $('lvl').innerHTML=''; $('tabs').innerHTML='';
  $('body').innerHTML=`<div class="fh-top"><div><div class="fh-meta"><span>${L.regionLabel} de ${esc(u.r)}</span><span>${esc(L.name)}</span><span><b style="color:var(--ink);font-weight:600">${int(V(id,'pop'))}</b> habitantes</span></div>
      <div style="margin-top:8px">${stamp('pop',D().refs.pop,'anual',{est:true})}</div>
      <p style="font-size:17px;line-height:1.55;max-width:62ch;margin:20px 0 0;text-wrap:pretty">${t2(`Os números de saúde de ${esc(u.n)} ao lado dos números de ${esc(L.name)} e do ${C.country.name}. Taxas por habitante, para comparar lugares de tamanhos diferentes.`,`Saúde de ${esc(u.n)} comparada com ${esc(L.name)} e o ${C.country.name}.`)}</p>
      ${cmpLegend(list)}<div class="lgd" style="margin-top:6px"><span><i class="bd" style="background:radial-gradient(circle at 2px 2px,var(--sub) 0.9px,transparent 1.2px) 0 0/5px 5px"></i>Poucos casos para comparar</span><span><i class="bd" style="background:var(--r2);box-shadow:none"></i>Só o número do estado</span></div>
      <nav class="fh-jump" aria-label="Seções da ficha">${FICHA.map(s=>`<a href="#f-${s.k}">${s.g}</a>`).join('')}</nav></div>
    <div class="loc"><div id="loc"></div><a class="lnk" style="margin-top:8px;font-size:14px" href="${href('geral',{u:id})}">Ver no mapa de ${esc(L.name)} ${ARW}</a></div></div>
    ${FICHA.map(s=>`<section class="fh-sec" id="f-${s.k}" aria-labelledby="h-${s.k}"><h2 id="h-${s.k}">${s.g}</h2><div class="fr-h"><span>Indicador</span><span>${esc(u.n).slice(0,16)}</span><span>${esc(L.name)}</span><span>${C.country.name}</span><span></span></div>${s.rows.map(row).join('')}</section>`).join('')}
    ${note(`Quando o município tem menos de ${SW.num(C.small.avg3/1000,0)} mil habitantes, mostramos a média de 3 anos; abaixo de ${SW.num(C.small.few/1000,0)} mil, o aviso “poucos casos”. Quando a fonte não tem o município, mostramos o número do estado. Linhas “em breve” ainda não têm dado no StatWorld.`)}`;
  if(L.key!=='BR'){ const mm=new MunMap($('loc'),{static:true,nolabel:true,aria:`Localização de ${u.n} em ${L.name}`}); mm.update(()=>({k:1})); mm.mark(id,null); }
  else $('loc').parentNode.hidden=true;
};
})();
