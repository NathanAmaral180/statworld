// Dados de exemplo das telas novas. Para outro país: troque este arquivo (e SW_GEO/SW_DATA.UNITS); as telas não mudam.
window.SW_X = (function(){
const order='RO AC AM RR PA AP TO MA PI CE RN PB PE AL SE BA MG ES RJ SP PR SC RS MS MT GO DF'.split(' ');
const v=s=>{const a=s.split(' ').map(x=>x==='-'?null:+x);return Object.fromEntries(order.map((k,i)=>[k,a[i]]))};
let seed=11; const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647-.5};
const lin=(A,t)=>{ if(t<=A[0][0]) return A[0][1]; for(let i=1;i<A.length;i++) if(t<=A[i][0]){const [t0,v0]=A[i-1],[t1,v1]=A[i];return v0+(v1-v0)*(t-t0)/(t1-t0)} return A[A.length-1][1]; };
const stepf=(A,t)=>{ let v=A[0][1]; for(const [t0,v0] of A) if(t>=t0) v=v0; return v; };
const monthly=(A,y0,m0,y1,m1,noise,dec)=>{const out=[];let y=y0,m=m0;while(y<y1||(y===y1&&m<=m1)){out.push([new Date(y,m,1),+(lin(A,y+m/12)+rnd()*noise).toFixed(dec)]);if(++m>11){m=0;y++}}return out};
const daily=(A,kind,noise,dec,last)=>{const out=[];const end=new Date(2026,10,20);let d=new Date(2021,10,22);let p=null;
  while(d<=end){ if(d.getDay()%6){ const t=d.getFullYear()+(d.getMonth()+d.getDate()/31)/12, tg=kind==='step'?stepf(A,t):lin(A,t);
    p = kind==='step'? tg : p==null? tg : p+(tg-p)*0.06+rnd()*noise*tg; out.push([new Date(d),+p.toFixed(dec)]); } d.setDate(d.getDate()+1); }
  out[out.length-1][1]=last; return out; };

const country={name:'Brasil',title:'A economia do Brasil',Unit:'Estado',unit:'estado',units:'estados',cur:'R$',city:'Capital',cities:'capitais'};
const pages={geral:'Brasil Visão geral.dc.html',agro:'Brasil Agro.html',trab:'Brasil Trabalho e renda.dc.html',precos:'Brasil Preços.dc.html',imp:'Brasil Impostos.dc.html',com:'Brasil Comércio exterior.dc.html',din:'Brasil Dinheiro e juros.dc.html',contas:'Brasil Contas públicas.dc.html'};

/* Impostos sobre produtos, % do PIB do estado */
const imp={label:'Impostos sobre produtos (% do PIB)',short:'Impostos / PIB',unit:'%',dec:1,cuts:[9,11,12.5,14,15.5],
  legend:['até 9%','9–11%','11–12,5%','12,5–14%','14–15,5%','15,5% ou mais'],
  data:v('10.2 8.1 15.8 7.4 9.6 7.9 9.8 11.2 11.0 13.1 11.6 12.0 14.2 11.4 11.9 13.4 13.9 15.1 12.8 16.4 14.6 15.3 14.1 12.3 10.9 13.6 8.7'),
  national:14.6, src:'IBGE, Contas Regionais 2023', date:'14 nov 2025', f:'anual',
  note:'PIB = valor adicionado + impostos sobre produtos. Esta medida mostra o peso dos impostos na economia do estado, não a arrecadação.'};
const impToday=[
 {v:'14,6%',l:'Impostos sobre produtos no PIB, 2023',src:'IBGE, Contas Nacionais · 14 nov 2025',f:'anual'},
 {v:'32,3%',l:'Carga tributária bruta em 2025, isto é, a arrecadação de todos os governos sobre o PIB',src:'Tesouro Nacional · 28 mar 2026',f:'anual'},
 {v:'R$ 218,4 bi',l:'Arrecadação federal em setembro',src:'Receita Federal · 23 out 2026',f:'mensal'}];

/* Trabalho e renda */
const unemp={label:'Desemprego',unit:'%',dec:1,cuts:[3.5,4.5,6,7.5,9],legend:['até 3,5%','3,5–4,5%','4,5–6%','6–7,5%','7,5–9%','9% ou mais'],
  data:v('3.1 7.2 7.6 6.0 7.1 8.4 4.9 6.9 7.3 6.8 7.9 7.4 9.6 7.8 8.1 9.2 4.6 4.2 7.5 5.3 3.7 2.6 4.5 3.4 2.8 4.7 7.3'),
  src:'IBGE, PNAD Contínua, 3º tri 2026',date:'31 out 2026',f:'trimestral'};
const income=v('3050 2600 2550 3000 2400 2900 2950 2150 2300 2250 2500 2400 2450 2300 2500 2300 3150 3250 4100 4150 3700 3800 3650 3600 3550 3300 5900');
const jobs=v('1.2 0.4 2.1 0.5 4.0 0.4 1.1 2.6 1.4 4.8 2.0 2.2 6.1 3.9 1.3 6.0 9.8 2.3 7.4 24.6 7.0 6.3 3.9 1.6 2.4 4.1 2.0');
const unempS=monthly([[2012.2,7.9],[2013,7.2],[2014,6.8],[2015,8.5],[2016,11.5],[2017.2,13.7],[2018,12.4],[2019,11.6],[2020.6,14.9],[2021.2,14.7],[2022,11.1],[2023,8.0],[2024,7.4],[2025,6.2],[2026,5.8],[2026.75,5.4]],2012,2,2026,8,.25,1);
unempS[unempS.length-1][1]=5.4;
const incomeS=monthly([[2012.2,2980],[2014,3150],[2016,3010],[2019,3080],[2020.5,3350],[2021.7,2860],[2023,3100],[2024,3260],[2025,3400],[2026.75,3512]],2012,2,2026,8,30,0);
incomeS[incomeS.length-1][1]=3512;
const trabToday=[
 {v:'5,4%',l:'Desemprego, trimestre até setembro',src:'IBGE, PNAD Contínua · 31 out 2026',f:'mensal'},
 {v:'R$ 3.512',l:'Renda média do trabalho, por mês',src:'IBGE, PNAD Contínua · 31 out 2026',f:'mensal'},
 {v:'+115,4 mil',l:'Empregos com carteira criados em setembro, saldo de admissões menos desligamentos',src:'Ministério do Trabalho, Novo Caged · 30 out 2026',f:'mensal'}];

/* Preços e poder de compra */
const metaC=y=>({2019:4.25,2020:4,2021:3.75,2022:3.5,2023:3.25})[y]??3;
const ipca=monthly([[2019,3.8],[2019.9,4.3],[2020.4,1.9],[2020.95,4.5],[2021.7,10.25],[2021.95,10.1],[2022.3,12.1],[2022.95,5.8],[2023.45,3.2],[2023.95,4.6],[2024.45,4.2],[2024.95,4.8],[2025.45,5.3],[2025.95,4.9],[2026.75,4.63]],2019,0,2026,9,.12,2);
ipca[ipca.length-1][1]=4.63;
const ipcaBand=ipca.map(p=>{const c=metaC(p[0].getFullYear());return [c-1.5,c+1.5]});
const capitals={RO:'Porto Velho',AC:'Rio Branco',AM:'Manaus',RR:'Boa Vista',PA:'Belém',AP:'Macapá',TO:'Palmas',MA:'São Luís',PI:'Teresina',CE:'Fortaleza',RN:'Natal',PB:'João Pessoa',PE:'Recife',AL:'Maceió',SE:'Aracaju',BA:'Salvador',MG:'Belo Horizonte',ES:'Vitória',RJ:'Rio de Janeiro',SP:'São Paulo',PR:'Curitiba',SC:'Florianópolis',RS:'Porto Alegre',MS:'Campo Grande',MT:'Cuiabá',GO:'Goiânia',DF:'Brasília'};
const cesta={unit:'R$',cuts:[620,680,740,790,830],legend:['até R$ 620','620–680','680–740','740–790','790–830','R$ 830 ou mais'],
  data:v('- - - - 700 - - - - 690 645 630 640 - 590 625 735 780 830 860 775 845 820 790 - 740 785'),
  src:'DIEESE, Pesquisa Nacional da Cesta Básica',date:'6 nov 2026',f:'mensal',ref:'outubro 2026'};
const minWage=1621;
const smCestas=(()=>{const A=[[2000,1.25],[2003,1.35],[2005,1.6],[2007,1.9],[2009,2.1],[2010,2.15],[2012,2.2],[2014,2.25],[2016,2.0],[2018,2.1],[2020,1.85],[2021,1.65],[2022,1.6],[2023,1.75],[2024,1.85],[2025,1.82],[2026,1.88]];
  const o=[];for(let y=2000;y<=2026;y++) o.push([String(y),+lin(A,y).toFixed(2)]); return o;})();
const precosToday=[
 {v:'4,63%',l:'Inflação em 12 meses até outubro (IPCA)',src:'IBGE · 11 nov 2026',f:'mensal'},
 {v:'R$ 860',l:'Cesta básica mais cara entre as capitais, São Paulo, outubro',src:'DIEESE · 6 nov 2026',f:'mensal'},
 {v:'1,88',l:'Cestas básicas que o salário mínimo compra, média de 2026',src:'DIEESE · 6 nov 2026',f:'mensal'}];

/* Comércio exterior */
const exportsUF={unit:'US$ bi',cuts:[1,3,10,20,40],legend:['até US$ 1 bi','1–3','3–10','10–20','20–40','US$ 40 bi ou mais'],
  data:v('2.6 0.05 0.9 0.3 24 0.4 3.2 5.6 1.5 2.4 0.6 0.3 2.3 0.9 0.2 11.5 41 9.5 47 72 25 12 22 11 33 13 0.2'),
  src:'Secex, Comex Stat, ano de 2025',date:'6 jan 2026',f:'mensal'};
const products=[['Soja',51.4],['Petróleo bruto',44.9],['Minério de ferro',30.3],['Carnes',25.2],['Açúcar',16.3],['Café',14.0],['Celulose',9.9],['Farelo de soja',9.5],['Milho',8.8],['Aeronaves',4.4]];
const partners=[['China',95.2],['Estados Unidos',40.5],['Argentina',14.6],['Países Baixos',11.6],['Espanha',8.8],['Singapura',7.8],['Chile',6.8],['México',6.5],['Índia',5.4],['Canadá',5.1]];
const exportsTotal=340.1;
const balance={label:'2026, janeiro a outubro',x:289.4,m:228.7,prev:{x:281.2,m:214.9},src:'Secex, Comex Stat',date:'6 nov 2026',f:'mensal'};
const comToday=[
 {v:'US$ 29,8 bi',l:'Exportações em outubro',src:'Secex · 6 nov 2026',f:'mensal'},
 {v:'US$ 23,9 bi',l:'Importações em outubro',src:'Secex · 6 nov 2026',f:'mensal'},
 {v:'+US$ 5,9 bi',l:'Saldo da balança em outubro',src:'Secex · 6 nov 2026',f:'mensal'}];

/* Dinheiro e juros */
const fin=[
 {k:'fx',name:'Dólar comercial',unit:'R$ por US$',f:'aovivo',dec:3,pre:'R$ ',
  pts:daily([[2021.9,5.55],[2022.3,4.75],[2022.8,5.25],[2023.5,4.8],[2024,4.9],[2024.95,6.1],[2025.5,5.55],[2026.3,5.25],[2026.9,5.33]],'walk',.006,3,5.326),
  day:{lo:5.318,hi:5.364,open:5.351,now:5.326},src:'Banco Central, Ptax e mercado · 20 nov 2026, 16h42, atraso de 15 min'},
 {k:'selic',name:'Selic',unit:'% ao ano, taxa efetiva',f:'diario',dec:2,suf:'%',
  pts:daily([[2021,7.65],[2022.1,10.65],[2022.4,12.65],[2022.65,13.65],[2023.6,13.15],[2023.95,11.65],[2024.4,10.4],[2024.7,10.65],[2025.05,12.15],[2025.4,14.65],[2026.3,14.15],[2026.84,13.65]],'step',0,2,13.65),
  day:null,src:'Banco Central · 19 nov 2026'},
 {k:'bolsa',name:'Bolsa, índice principal',unit:'pontos',f:'aovivo',dec:0,
  pts:daily([[2021.9,102000],[2022.5,98000],[2022.9,112000],[2023.3,101000],[2023.95,134000],[2024.5,125000],[2024.95,121000],[2025.6,136000],[2026.3,132000],[2026.9,138600]],'walk',.009,0,138602),
  day:{lo:137420,hi:139115,open:137900,now:138602},src:'B3 · 20 nov 2026, 16h42, atraso de 15 min'},
 {k:'cred',name:'Juros do crédito pessoal',unit:'% ao ano, média de 5 dias úteis',f:'diario',dec:1,suf:'%',
  pts:daily([[2021.9,75],[2022.9,85],[2023.9,90],[2024.9,86],[2025.9,89],[2026.9,87.4]],'walk',.004,1,87.4),
  day:null,src:'Banco Central, taxas de juros por modalidade · 19 nov 2026'}];
const dinToday=[
 {v:'13,75%',l:'Selic, meta ao ano',src:'Banco Central · 4 nov 2026',f:'reuniao'},
 {v:'4,2%',l:'Inflação esperada para os próximos 12 meses',src:'Banco Central, Focus · 17 nov 2026',f:'semanal'},
 {v:'R$ 6,6 tri',l:'Saldo total do crédito, setembro',src:'Banco Central · 29 out 2026',f:'mensal'}];

/* Contas públicas (governo central, 2025) */
const CAT=['var(--p-leite)','var(--p-soja)','var(--p-milho)','var(--p-gado)','var(--p-mandioca)','var(--p-cana)','var(--p-frango)','var(--p-cafe)'];
const r100={label:'Governo federal, 2025',
  in:[['cons','Impostos sobre consumo',30],['renda','Impostos sobre renda e lucro',27],['prev','Contribuições à previdência',22],['outras','Outras receitas',12],['div','Nova dívida',9]],
  out:[['apos','Aposentadorias e pensões',38],['juros','Juros da dívida',16],['transf','Repasses a estados e municípios',14],['assist','Assistência social',9],['saude','Saúde',8],['edu','Educação',6],['def','Defesa e segurança',3],['dem','Demais áreas',6]],
  revenue:2.94, spend:3.23, src:'Tesouro Nacional, Resultado do Tesouro',date:'29 jan 2026',f:'anual'};
r100.in=r100.in.map(([k,name,v],i)=>({k,name,v,c:CAT[i]})); r100.out=r100.out.map(([k,name,v],i)=>({k,name,v,c:CAT[i]}));
const debt=monthly([[2006,55.5],[2008,56],[2010,51.8],[2013,51.5],[2014,56.3],[2015,65.5],[2016,69.8],[2017,73.7],[2018,75.3],[2019,74.4],[2020.8,88.6],[2021,86.9],[2021.95,77.3],[2022.95,71.7],[2023.95,73.8],[2024.95,76.5],[2025.95,78.4],[2026.7,79.6]],2006,0,2026,8,.25,1);
debt[debt.length-1][1]=79.6;
const functions=[['Previdência social',1020],['Juros da dívida',430],['Repasses a estados e municípios',390],['Assistência social',250],['Saúde',225],['Educação',165],['Defesa nacional',120],['Trabalho',110],['Agricultura',38],['Transporte',34],['Segurança pública',22],['Ciência e tecnologia',14]];
const contasToday=[
 {v:'−0,6%',l:'Resultado primário em 12 meses, % do PIB',src:'Banco Central · 31 out 2026',f:'mensal'},
 {v:'79,6%',l:'Dívida bruta do governo, % do PIB, setembro',src:'Banco Central · 31 out 2026',f:'mensal'},
 {v:'7,9%',l:'Juros nominais em 12 meses, % do PIB',src:'Banco Central · 31 out 2026',f:'mensal'}];

return {country,pages,imp,impToday,unemp,income,jobs,unempS,incomeS,trabToday,ipca,ipcaBand,capitals,cesta,minWage,smCestas,precosToday,exportsUF,products,partners,exportsTotal,balance,comToday,fin,dinToday,r100,debt,functions,contasToday};
})();
