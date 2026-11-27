(function(){
const SW = window.SW = {};
const D = () => window.SW_DATA;

/* ---------- tema ---------- */
const q = new URLSearchParams(location.search||location.hash.slice(1));
document.documentElement.dataset.theme = q.get('theme') || localStorage.getItem('sw-theme') || 'light';
SW.theme = () => document.documentElement.dataset.theme;
SW.onTheme = [];
SW.toggleTheme = () => {
  const t = SW.theme()==='dark'?'light':'dark';
  document.documentElement.dataset.theme = t; localStorage.setItem('sw-theme', t);
  SW.onTheme.forEach(f=>f(t)); SW.syncThemeBtn();
};
SW.syncThemeBtn = () => { const b=document.getElementById('themeBtn'); if(b) b.textContent = SW.theme()==='dark'?'Tema claro':'Tema escuro'; };

/* ---------- formatos ---------- */
SW.num = (n,dec=1) => n.toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
SW.brl = bi => bi==null?'sem dado': bi===0?'—': bi>=1? 'R$ '+SW.num(bi,1)+' bi' : 'R$ '+SW.num(Math.round(bi*1000),0)+' mi';
SW.ord = n => n+'º';
SW.esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- ícones: traço 1,5, grade 24, uma cor (currentColor) ---------- */
const P = {
 soja:'<path d="M4.6 19.4C3.2 14.8 6.2 8.4 12 6.4c4.4-1.5 7.8-1.8 7.8-1.8s.4 3.6-1.6 8.1c-2.6 5.8-8.6 7.9-13.6 6.7z"/><circle cx="8.8" cy="15.2" r="1.6"/><circle cx="12.3" cy="11.7" r="1.6"/><circle cx="15.8" cy="8.4" r="1.6"/>',
 milho:'<path d="M12 3c2.4 0 3.8 3.6 3.8 8s-1.4 7.5-3.8 7.5-3.8-3.1-3.8-7.5S9.6 3 12 3z"/><path d="M12 3.5v14.5M8.6 8.5h6.8M8.3 12h7.4M8.8 15.4h6.4"/><path d="M12 18c-1.3 2-3.3 3-5.6 3M12 18c1.3 2 3.3 3 5.6 3"/>',
 cana:'<path d="M9.5 21V3M13.5 21V3M9.5 8h4M9.5 14h4"/><path d="M13.5 10.5c2.8-.6 5-2.6 6-5.5M9.5 16.5c-2.4-.4-4.2-1.9-5-4.5"/>',
 cafe:'<ellipse cx="12" cy="12" rx="6" ry="8.6" transform="rotate(32 12 12)"/><path d="M15.6 5.2c-3.6 2.6-.4 6.4-3.5 8.9-1.6 1.3-2.6 2.6-2.5 4.6"/>',
 arroz:'<path d="M8 21c1.2-5.5 1.6-11 5-17"/><path d="M9.2 15.5c-1.8.1-3.2-.6-4-2 1.8-.1 3.2.6 4 2zM10 11.3c-1.7-.2-2.9-1.2-3.4-2.7 1.7.2 2.9 1.2 3.4 2.7zM11.4 7.4c-1.5-.5-2.5-1.6-2.7-3.2 1.5.5 2.5 1.6 2.7 3.2zM9.7 13.6c1.4-1.1 2.9-1.4 4.4-.9-1.4 1.1-2.9 1.4-4.4.9zM10.8 9.5c1.3-1.2 2.8-1.6 4.3-1.2-1.3 1.2-2.8 1.6-4.3 1.2z"/>',
 mandioca:'<path d="M12 8.5c-2.2 0-3.3 2-3.2 4.3.2 3.6 2 6.5 3.2 8.2 1.2-1.7 3-4.6 3.2-8.2.1-2.3-1-4.3-3.2-4.3z"/><path d="M12 8.5V5M12 5 8.5 3M12 5l3.5-2M12 5v-2"/>',
 gado:'<path d="M7.5 7.5h9l-.8 8.2c-.3 2.6-1.8 4.3-3.7 4.3s-3.4-1.7-3.7-4.3z"/><path d="M7.5 7.5C5.2 7.3 3.6 6 3 4M16.5 7.5c2.3-.2 3.9-1.5 4.5-3.5M7.7 9.6l-3.2 1.2M16.3 9.6l3.2 1.2"/><path d="M10.3 16.8h.01M13.7 16.8h.01"/>',
 frango:'<circle cx="8" cy="7" r="2.5"/><path d="M5.6 6.6 3.6 7.6l2.2.6M7 4.6c.3-1 1.4-1.5 2.2-.9"/><path d="M9.9 8.9c.8 1.3 2.3 2.1 4.1 2.1h5c0 4.1-3.3 7.4-7.5 7.4S4.5 15.4 6 11.4c.4-1 .9-1.8 1.5-2.4"/><path d="M19 11l1-4.5-3.6 2.4M10.5 18.4V21M13.5 18.4V21"/>',
 leite:'<path d="M9 3h6M9.5 3v3L7 9.5V21h10V9.5L14.5 6V3"/><path d="M7 13.5h10"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>'
};
SW.icon = (k,cls='') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[k]||''}</svg>`;
SW.iconPaths = P;

SW.freq = f => `<span class="freq" title="Frequência de atualização">${({diario:'Diário',mensal:'Mensal',trimestral:'Trimestral',anual:'Anual',reuniao:'Por reunião'})[f]}</span>`;

/* ---------- cabeçalho ---------- */
SW.header = (active='Economia') => `<header class="top"><div class="wrap top-in">
 <a class="brand" href="Economia do Brasil.html"><span class="logo"><i></i><i></i><i></i><i></i></span>StatWorld</a>
 <nav>${['Economia','Saúde','Política','Demografia'].map(n=>`<a class="${n===active?'on':''}" href="${n==='Economia'?'Economia do Brasil.html':'#'}">${n}</a>`).join('')}</nav>
 <button class="btn" id="themeBtn" type="button">Tema escuro</button></div></header>`;
SW.mountHeader = (el,active) => { el.outerHTML = SW.header(active); document.getElementById('themeBtn').onclick = SW.toggleTheme; SW.syncThemeBtn(); };

SW.today = (items,label='Brasil hoje',note='Números mais recentes, nacionais') => `<section class="today" aria-label="${label}">
 <div class="today-h">${label}<span>${note}</span></div>
 ${items.map(k=>`<div class="kpi"><div class="kpi-top"><b>${k.v}</b>${SW.freq(k.f)}</div><div class="lbl">${k.l}</div><div class="src">${k.src}</div></div>`).join('')}
</section>`;

SW.layers = active => `<nav class="layers" aria-label="Camadas">
 ${[['geral','Visão geral','Economia do Brasil.html'],['agro','Agro','Brasil Agro.html'],['ind','Indústria'],['serv','Serviços']].map(([k,n,h])=>
   h? (k===active?`<span class="on" aria-current="page">${n}</span>`:`<a href="${h}">${n}</a>`)
    : `<span class="off" aria-disabled="true">${n}<em class="soon">em breve</em></span>`).join('')}
</nav>`;

/* ---------- classificação ---------- */
SW.cls = (v,cuts) => { let i=0; while(i<cuts.length && v>=cuts[i]) i++; return i; };
SW.rankOf = (data,uf) => { const vals=Object.entries(data).filter(([,x])=>x!=null&&x>0).sort((a,b)=>b[1]-a[1]); const i=vals.findIndex(([k])=>k===uf); return {rank:i<0?null:i+1,of:vals.length}; };

/* ---------- mapa ---------- */
const CALL = {RN:[812,214],PB:[812,244],PE:[812,274],AL:[812,304],SE:[812,334],ES:[728,532],RJ:[690,614],DF:[588,404],SC:[548,700]};
const LAB = {GO:[478,458],PI:[622,276],SP:[505,575],PR:[452,624],MG:[598,494],AC:[86,302],CE:[690,214],MA:[575,212]};
let mapSeq=0;
SW.Map = class {
  constructor(el,o={}){
    this.o=o; this.id='h'+(++mapSeq); const G=window.SW_GEO, S=G.states, W=860;
    this.ufs=Object.keys(S);
    el.innerHTML = `<svg class="map" viewBox="0 0 ${W} ${G.h}" role="img" aria-label="${o.aria||'Mapa por estado'}">
      <defs><pattern id="${this.id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" style="fill:var(--bg)"/><line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--hatch);stroke-width:1.2"/></pattern></defs>
      <g>${this.ufs.map(u=>`<path class="ol" d="${S[u].d}"/>`).join('')}</g>
      <g class="g-st">${this.ufs.map(u=>`<path class="st" data-uf="${u}" d="${S[u].d}"><title>${D().UNITS[u][0]}</title></path>`).join('')}</g>
      <g class="g-cl">${Object.entries(CALL).map(([u,[x,y]])=>{const [cx,cy]=S[u].c;return `<line class="cl" x1="${cx}" y1="${cy}" x2="${x-6}" y2="${y-4}"/><circle class="dot" cx="${cx}" cy="${cy}" r="2"/>`}).join('')}</g>
      <path class="hov" d=""/><path class="sel" d=""/>
      <g class="g-lab"></g></svg>`;
    this.svg=el.querySelector('svg'); this.paths={}; this.svg.querySelectorAll('.st').forEach(p=>this.paths[p.dataset.uf]=p);
    const hit = e => { const t=e.target.closest('[data-uf]'); return t&&t.dataset.uf; };
    this.svg.addEventListener('mouseover',e=>{const u=hit(e); if(u) o.onHover&&o.onHover(u);});
    this.svg.addEventListener('mouseleave',()=>o.onHover&&o.onHover(null));
    this.svg.addEventListener('click',e=>{const u=hit(e); if(u) o.onClick&&o.onClick(u);});
  }
  pos(u){ const S=window.SW_GEO.states; return CALL[u]? {x:CALL[u][0],y:CALL[u][1],out:true} : {x:(LAB[u]||S[u].c)[0],y:(LAB[u]||S[u].c)[1],out:false}; }
  // spec.fill(u) -> {f:'var(--r3)', k:3} | {hatch:true} | {zero:true} | {f:'var(--p-soja)', icon:'soja'}
  update(spec){
    this.spec=spec; const S=window.SW_GEO.states; let lab='';
    for(const u of this.ufs){
      const r=spec.fill(u), p=this.paths[u];
      p.style.fill = r.hatch?`url(#${this.id})`: r.zero?'var(--track)': r.f;
      const {x,y,out}=this.pos(u);
      if(r.icon){
        if(out){ lab+=`<g data-uf="${u}" style="cursor:pointer"><circle class="chip" cx="${x+4}" cy="${y-4}" r="11"/><svg class="chipic" x="${x-4}" y="${y-12}" width="16" height="16" viewBox="0 0 24 24"><g class="ic" style="stroke-width:1.7">${P[r.icon]}</g></svg><text class="lab out" x="${x+20}" y="${y}">${u}</text></g>`; }
        else { lab+=`<circle class="chip" cx="${x}" cy="${y-6}" r="12" style="pointer-events:none"/><svg class="chipic" x="${x-8}" y="${y-14}" width="16" height="16" viewBox="0 0 24 24" style="pointer-events:none"><g class="ic" style="stroke-width:1.7">${P[r.icon]}</g></svg>${S[u].a>4000?`<text class="lab" x="${x}" y="${y+22}" text-anchor="middle" style="font-size:11px">${u}</text>`:''}`; }
      } else {
        const strong = r.k!=null && r.k>=4;
        lab+= out? `<text class="lab out" data-uf="${u}" x="${x}" y="${y}">${u}</text>` : `<text class="lab${strong?' strong':''}" x="${x}" y="${y+4}" text-anchor="middle">${u}</text>`;
      }
    }
    this.svg.querySelector('.g-lab').innerHTML=lab;
  }
  mark(sel,hov){
    const S=window.SW_GEO.states;
    this.svg.querySelector('.sel').setAttribute('d', sel?S[sel].d:'');
    this.svg.querySelector('.hov').setAttribute('d', hov&&hov!==sel?S[hov].d:'');
  }
};

SW.legendRamp = (labels,{nulls=0,zero=false,zeroLabel='Não produz'}={}) => `<div class="legend">
 <div class="ramp">${labels.map((l,i)=>`<div><i style="background:var(--r${i})"></i>${l}</div>`).join('')}</div>
 ${zero?`<div class="lg-h lg-z"><i></i>${zeroLabel}</div>`:''}
 ${nulls?`<div class="lg-h"><i></i>Sem dado (${nulls} ${nulls>1?'estados':'estado'})</div>`:''}
</div>`;

/* ---------- ranking ---------- */
// rows: [{uf,v,txt,icon?}] ; v null = sem dado, 0 = não produz
SW.Ranking = class {
  constructor(el,o){ this.el=el; this.o=o; this.expanded=false;
    el.addEventListener('mouseover',e=>{const li=e.target.closest('li[data-uf]'); if(li) o.onHover(li.dataset.uf);});
    el.addEventListener('mouseleave',()=>o.onHover(null));
    el.addEventListener('click',e=>{ if(e.target.closest('.more')){ this.expanded=!this.expanded; this.render(this.last); return;} const li=e.target.closest('li[data-uf]'); if(li) o.onClick(li.dataset.uf);});
    el.addEventListener('keydown',e=>{ if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return; e.preventDefault();
      const ord=this.sorted.map(r=>r.uf); let i=ord.indexOf(this.last.sel);
      i = e.key==='Home'?0: e.key==='End'?ord.length-1: Math.max(0,Math.min(ord.length-1,i+(e.key==='ArrowDown'?1:-1)));
      o.onClick(ord[i]); requestAnimationFrame(()=>{const li=this.el.querySelector(`li[data-uf="${ord[i]}"]`); li&&li.focus();});
    });
  }
  render(st){ // {rows, sel, hov, col, nTop}
    this.last=st; const N=D().UNITS, n=st.nTop||8;
    const val=st.rows.filter(r=>r.v!=null&&r.v>0).sort((a,b)=>b.v-a.v);
    const zero=st.rows.filter(r=>r.v===0).sort((a,b)=>N[a.uf][0].localeCompare(N[b.uf][0]));
    const nul=st.rows.filter(r=>r.v==null).sort((a,b)=>N[a.uf][0].localeCompare(N[b.uf][0]));
    this.sorted=[...val,...zero,...nul];
    const max=val.length?val[0].v:1, icons=st.rows.some(r=>r.icon);
    const row=(r,i)=>{ const nd=r.v==null, z=r.v===0;
      return `<li data-uf="${r.uf}" tabindex="${r.uf===st.sel?0:-1}" class="${icons?'ic-on ':''}${r.uf===st.sel?'on':''} ${r.uf===st.hov?'hv':''}" aria-selected="${r.uf===st.sel}" role="option">
      <span class="n">${nd||z?'—':i+1}</span>${icons?(r.icon?SW.icon(r.icon):'<span></span>'):''}<span class="nm">${N[r.uf][0]}</span>
      <span class="bar ${nd?'h':z?'z':''}">${nd||z?'':`<i style="width:${Math.max(2,r.v/max*100)}%"></i>`}</span>
      <span class="v ${nd||z?'nd':''}">${nd?'sem dado':z?'não produz':r.txt}</span></li>`; };
    let list;
    if(this.expanded) list=this.sorted.map((r,i)=>row(r,i)).join('');
    else { list=val.slice(0,n).map((r,i)=>row(r,i)).join('');
      const si=this.sorted.findIndex(r=>r.uf===st.sel);
      if(si>=n){ list+=`<li class="gap" aria-hidden="true">···</li>`+row(this.sorted[si],si); } }
    const extra=[nul.length?`${nul.length} sem dado`:'',zero.length?`${zero.length} não produz`:''].filter(Boolean).join(' · ');
    this.el.innerHTML = `<div class="rk-h"><span>Estado</span><span>${st.col}</span></div>
      <ul class="rk" role="listbox" aria-label="Ranking dos estados">${list}</ul>
      <div class="rk-more"><button class="more" type="button" aria-expanded="${this.expanded}">${this.expanded?'Mostrar só os 8 primeiros':`Ver todos os ${st.rows.length} estados`}</button><span>${extra}</span></div>`;
  }
};
})();
