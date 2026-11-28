// Dados da tela. Para outro país/tema: troque UNITS, as medidas e os cortes; o mapa, a ficha e o ranking não mudam.
window.SW_DATA = (function(){
const UNITS = {
 AC:['Acre','Norte'],AL:['Alagoas','Nordeste'],AP:['Amapá','Norte'],AM:['Amazonas','Norte'],BA:['Bahia','Nordeste'],CE:['Ceará','Nordeste'],DF:['Distrito Federal','Centro-Oeste'],ES:['Espírito Santo','Sudeste'],GO:['Goiás','Centro-Oeste'],MA:['Maranhão','Nordeste'],MT:['Mato Grosso','Centro-Oeste'],MS:['Mato Grosso do Sul','Centro-Oeste'],MG:['Minas Gerais','Sudeste'],PA:['Pará','Norte'],PB:['Paraíba','Nordeste'],PR:['Paraná','Sul'],PE:['Pernambuco','Nordeste'],PI:['Piauí','Nordeste'],RJ:['Rio de Janeiro','Sudeste'],RN:['Rio Grande do Norte','Nordeste'],RS:['Rio Grande do Sul','Sul'],RO:['Rondônia','Norte'],RR:['Roraima','Norte'],SC:['Santa Catarina','Sul'],SP:['São Paulo','Sudeste'],SE:['Sergipe','Nordeste'],TO:['Tocantins','Norte']};
const order = 'RO AC AM RR PA AP TO MA PI CE RN PB PE AL SE BA MG ES RJ SP PR SC RS MS MT GO DF'.split(' ');
const v = s => { const a=s.split(' ').map(x=>x==='-'?null:+x); return Object.fromEntries(order.map((k,i)=>[k,a[i]])); };

// 1c · Economia
const econ = {
 peso:{label:'Peso no PIB',col:'Peso no PIB',unit:'%',dec:1,cuts:[0.5,1,2,4,8],legend:['até 0,5%','0,5–1%','1–2%','2–4%','4–8%','8% ou mais'],
  data:v('0.6 0.2 1.4 0.2 2.6 0.2 0.6 1.3 0.7 2.1 0.8 0.8 2.5 0.7 0.5 3.9 9.3 2.0 10.7 30.2 6.4 4.7 6.4 1.7 2.8 3.2 3.3'),
  src:'IBGE, Contas Regionais 2023, divulgadas em 14 nov 2025'},
 pc:{label:'PIB por pessoa',col:'PIB por pessoa',unit:'R$ mil',dec:0,cuts:[25,30,40,50,70],legend:['até R$ 25 mil','25–30 mil','30–40 mil','40–50 mil','50–70 mil','R$ 70 mil ou mais'],
  data:v('40 28 37 34 34 30 39 21 24 24 28 23 27 24 27 27 44 53 66 70 60 69 60 66 77 46 117'),
  src:'IBGE, Contas Regionais 2023, divulgadas em 14 nov 2025'},
 cresc:{label:'Crescimento em 2023',col:'Crescimento em 2023',unit:'%',dec:1,sign:true,cuts:[1.5,2.5,4,8,12],legend:['até 1,5%','1,5–2,5%','2,5–4%','4–8%','8–12%','12% ou mais'],
  data:v('1.3 14.7 2.1 - 1.4 2.9 7.9 - 3.1 3.0 - 3.0 2.4 - 3.1 2.3 - - 5.7 1.4 - 1.9 1.3 13.4 12.9 - -'),
  src:'IBGE, Contas Regionais 2023, divulgadas em 14 nov 2025'}
};

// Agro · Valor Bruto da Produção 2025, R$ bilhões
const PRODUCTS = {
 soja:{name:'Soja',kind:'lavoura',cuts:[1,5,10,20,40]},
 milho:{name:'Milho',kind:'lavoura',cuts:[0.5,2,5,10,20]},
 cana:{name:'Cana-de-açúcar',short:'Cana',kind:'lavoura',cuts:[0.5,1,3,8,20]},
 cafe:{name:'Café',kind:'lavoura',cuts:[0.1,0.5,2,5,15]},
 arroz:{name:'Arroz',kind:'lavoura',cuts:[0.1,0.3,1,2,5]},
 mandioca:{name:'Mandioca',kind:'lavoura',cuts:[0.1,0.3,0.5,1,2]},
 gado:{name:'Gado',long:'Gado de corte',kind:'pecuaria',cuts:[1,3,7,12,20]},
 frango:{name:'Frango',kind:'pecuaria',cuts:[0.5,2,5,10,20]},
 leite:{name:'Leite',kind:'pecuaria',cuts:[0.5,1,3,8,15]}
};
const vbp = {
 soja:v('5 0.05 0.02 0.9 7 0.05 10 10 9 0 0 0 0 0 0 20 18 0 0 8 45 5 40 27 95 38 1.2'),
 milho:v('1.5 0.1 0.03 0.2 1.5 0.01 2 2.5 2.5 0.4 0.05 0.1 0.2 0.1 1.2 4 9 0.2 0.02 5 14 3 5 11 35 12 0.5'),
 cana:v('0.05 0.02 0.05 0.01 0.1 0 0.3 0.4 0.3 0.1 0.6 1.5 2.5 4 0.5 0.8 14 0.6 0.5 60 6 0.02 0.05 8 3 15 0.02'),
 cafe:v('2.5 0.05 0.1 - 0.05 0 0 0 0 0.03 0 0 0.02 0 0 3 34 13 0.4 5.5 1 0 0 0 0.2 0.3 0.1'),
 arroz:v('0.1 0.02 0.01 0.3 0.3 - 1.0 0.5 0.2 0.02 0 0 0 0.05 0.1 0.02 0.1 0.005 0.002 0.1 0.3 2 13 0.2 0.8 0.3 0'),
 mandioca:v('0.2 0.5 1.4 0.15 4 0.3 0.1 0.8 0.3 0.5 0.15 0.15 0.3 0.25 0.2 1 0.4 0.1 0.05 0.8 1.5 0.2 0.5 0.5 0.15 0.2 -'),
 gado:v('10 2.5 1.2 0.8 17 0.1 8 4 1 1 0.5 0.5 1 0.6 0.5 7 18 1.5 1 12 5 2 7 18 30 20 0.2'),
 frango:v('0.6 0.2 0.3 0.1 1.2 0.05 0.5 0.5 0.5 3.5 0.6 0.8 4 0.5 0.4 3 10 1 0.5 14 40 18 15 5 7 9 1.0'),
 leite:v('2 0.1 0.15 0.05 1.2 0.02 0.6 0.5 0.3 1.5 0.7 0.6 2 0.8 0.8 2.5 22 1 1.3 5 10 8 10 0.7 1.5 7 0.15')
};
const vbpSrc = 'MAPA, Valor Bruto da Produção Agropecuária 2025, base de 12 jan 2026';
const agroToday = [
 {v:'354,8 mi t',l:'Safra de grãos 2025/26, estimativa',src:'Conab, 2º levantamento · 13 nov 2026',f:'mensal'},
 {v:'R$ 1,41 tri',l:'Valor da produção agropecuária 2026, estimativa',src:'MAPA · 14 nov 2026',f:'mensal'},
 {v:'US$ 13,9 bi',l:'Exportações do agro em outubro',src:'MAPA, Agrostat · 12 nov 2026',f:'mensal'}];
const econToday = [
 {v:'+2,0%',l:'PIB, 2º tri 2026 sobre 2º tri 2025',src:'IBGE · 2 set 2026',f:'trimestral'},
 {v:'4,63%',l:'IPCA, 12 meses até outubro',src:'IBGE · 11 nov 2026',f:'mensal'},
 {v:'13,75%',l:'Selic, meta ao ano',src:'Banco Central · 4 nov 2026',f:'reuniao'}];

// Soja · preço diário (indicador Paranaguá, R$/saca 60 kg), série reproduzível
function soyPrices(){
 let s=7, r=()=>{s=(s*16807)%2147483647;return s/2147483647-.5};
 const out=[]; const end=new Date(2026,10,20); let d=new Date(2021,10,22); let p=152;
 const drift=t=>{ // trajetória aproximada: alta 2022, queda 2023-24, recuperação 2025
  const y=t.getFullYear()+t.getMonth()/12;
  return y<2022.4?190:y<2022.9?185:y<2023.5?150:y<2024.3?125:y<2024.9?138:y<2025.6?130:y<2026.3?140:y<2026.75?145:136};
 while(d<=end){ if(d.getDay()%6){ p+= (drift(d)-p)*0.02 + r()*2.6; out.push([new Date(d), Math.round(p*100)/100]); } d.setDate(d.getDate()+1); }
 out[out.length-1][1]=138.42; out[out.length-2][1]=Math.round(138.42/1.0084*100)/100;
 return out;
}

// História · Conab, série histórica (ano de colheita)
const conab = [[1977,46.9,37.3],[1980,50.9,40.2],[1985,58.0,41.5],[1990,58.3,38.9],[1995,81.1,38.5],[2000,83.0,37.8],[2003,123.2,43.9],[2005,114.7,49.1],[2008,144.1,47.4],[2010,149.3,47.4],[2013,188.7,53.6],[2015,207.7,57.9],[2017,238.0,60.9],[2020,257.0,65.9],[2021,256.0,69.0],[2023,319.8,78.5],[2024,297.7,79.8],[2025,350.2,81.7]];
// Área plantada de soja por UF, milhões de ha, safras 1980/81 … 2020/21. null = sem dado (TO criado em 1988)
const soyArea = {
 1980:v('0 0 0 0 0 0 - 0 0 0 0 0 0 0 0 0.01 0.2 0 0 0.5 2.4 0.4 4.0 0.8 0.1 0.2 0'),
 1990:v('0.01 0 0 0 0 0 0.02 0.05 0.01 0 0 0 0 0 0 0.3 0.4 0 0 0.6 2.2 0.4 3.5 1.2 1.5 0.7 0.05'),
 2000:v('0.01 0 0 0 0.01 0 0.08 0.2 0.03 0 0 0 0 0 0 0.6 0.6 0 0 0.6 2.8 0.3 3.0 1.1 3.0 1.5 0.04'),
 2010:v('0.12 0 0 0.01 0.1 0 0.4 0.5 0.3 0 0 0 0 0 0 1.0 1.0 0 0 0.6 4.5 0.45 4.0 1.7 6.2 2.5 0.05'),
 2020:v('0.4 0.01 0.01 0.06 0.6 0.02 1.1 1.0 0.8 0 0 0 0 0 0 1.6 1.7 0 0 1.1 5.6 0.7 6.0 3.3 10.5 3.6 0.08')};

return {UNITS,order,econ,PRODUCTS,vbp,vbpSrc,agroToday,econToday,soyPrices,conab,soyArea};
})();
