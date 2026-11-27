// Configuração do tema Demografia. Para outro país ou estado: troque este arquivo (e as malhas sw-geo*.js); as telas não mudam.
window.SW_DATA = {UNITS:{
 AC:['Acre','Norte'],AL:['Alagoas','Nordeste'],AP:['Amapá','Norte'],AM:['Amazonas','Norte'],BA:['Bahia','Nordeste'],CE:['Ceará','Nordeste'],DF:['Distrito Federal','Centro-Oeste'],ES:['Espírito Santo','Sudeste'],GO:['Goiás','Centro-Oeste'],MA:['Maranhão','Nordeste'],MT:['Mato Grosso','Centro-Oeste'],MS:['Mato Grosso do Sul','Centro-Oeste'],MG:['Minas Gerais','Sudeste'],PA:['Pará','Norte'],PB:['Paraíba','Nordeste'],PR:['Paraná','Sul'],PE:['Pernambuco','Nordeste'],PI:['Piauí','Nordeste'],RJ:['Rio de Janeiro','Sudeste'],RN:['Rio Grande do Norte','Nordeste'],RS:['Rio Grande do Sul','Sul'],RO:['Rondônia','Norte'],RR:['Roraima','Norte'],SC:['Santa Catarina','Sul'],SP:['São Paulo','Sudeste'],SE:['Sergipe','Nordeste'],TO:['Tocantins','Norte']}};
window.SW_X = {country:{name:'Brasil',title:'A população do Brasil',units:'estados',Unit:'Estado'},pages:{}};

window.SW_DEMO = {
 topic:'Demografia', consult:'consulta em 26 nov 2026',
 country:{key:'BR',name:'Brasil',title:'A população do Brasil',Unit:'Estado',units:'estados',regionLabel:'Região'},
 // segundo nível: um estado por município
 sub:{SP:{key:'SP',name:'São Paulo',title:'A população de São Paulo',Unit:'Município',units:'municípios',regionLabel:'Região intermediária',
   flag:{light:'oklch(0.56 0.19 27)',dark:'oklch(0.70 0.16 27)',name:'vermelho da bandeira'}, ficha:'3509502'}},

 // abas em grupos; por nível: 'ok' | 'estado' (só o número do estado) | 'sem' (sem dado neste nível) | 'breve'
 TABS:[
  {g:'',items:[{k:'geral',n:'Visão geral',BR:'ok',SUB:'ok'}]},
  {g:'Quantos somos',items:[{k:'cresc',n:'Crescimento',BR:'ok',SUB:'ok'}]},
  {g:'Idade e vida',items:[{k:'idade',n:'Pirâmide etária',BR:'ok',SUB:'ok'},{k:'vital',n:'Nascimentos e mortes',BR:'ok',SUB:'ok'},{k:'vida',n:'Esperança de vida',BR:'ok',SUB:'estado'}]},
  {g:'Quem somos',items:[{k:'raca',n:'Cor ou raça',BR:'ok',SUB:'ok'},{k:'povos',n:'Indígenas e quilombolas',BR:'ok',SUB:'ok'}]},
  {g:'Onde moramos',items:[{k:'dom',n:'Domicílios',BR:'ok',SUB:'ok'},{k:'mig',n:'Migração',BR:'ok',SUB:'breve'}]}
 ],
 pages:{BR:{geral:'Brasil Demografia.dc.html',cresc:'Brasil Crescimento.dc.html',idade:'Brasil Pirâmide etária.dc.html',vital:'Brasil Nascimentos e mortes.dc.html',vida:'Brasil Esperança de vida.dc.html',raca:'Brasil Cor ou raça.dc.html',povos:'Brasil Indígenas e quilombolas.dc.html',dom:'Brasil Domicílios.dc.html',mig:'Brasil Migração.dc.html'},
        SUB:{geral:'SP Demografia.dc.html',cresc:'SP Crescimento.dc.html',ficha:'SP Ficha do município.dc.html'}},

 // fontes: texto, frequência, tabela
 SRC:{
  pop:{s:'IBGE, Censo 2022',t:'tabela 4709',f:'censo'},
  dens:{s:'IBGE, Censo 2022',t:'tabela 4714',f:'censo'},
  est:{s:'IBGE, Estimativas da população 2026',t:'tabela 6579',f:'est'},
  live:{s:'StatWorld, sobre IBGE Estimativas 2026 e Registro Civil 2024',t:'cálculo',f:'est'},
  pyr:{s:'IBGE, Censo 2022',t:'tabela 9514',f:'censo'},
  pyrH:{s:'IBGE, Censos 1980 a 2010',t:'tabela 200',f:'censo'},
  proj:{s:'IBGE, Projeções da População, revisão 2018',t:'tabelas 7358 e 7360',f:'proj'},
  rc:{s:'IBGE, Estatísticas do Registro Civil 2024',t:'tabelas 2609 e 2654',f:'anual'},
  e0:{s:'IBGE, Projeções da População, revisão 2018',t:'tabela 7362',f:'proj'},
  raca:{s:'IBGE, Censo 2022',t:'tabela 9605',f:'censo'},
  ind:{s:'IBGE, Censo 2022',t:'tabela 9718',f:'censo'},
  qui:{s:'IBGE, Censo 2022',t:'tabela 9578',f:'censo'},
  dom:{s:'IBGE, Censo 2022',t:'tabela 4712',f:'censo'},
  sit:{s:'IBGE, Censo 2022',t:'tabela 9923',f:'censo'},
  mig:{s:'IBGE, Censo 2022',t:'tabela 631',f:'censo'}
 },
 // termos oficiais do IBGE, na ordem do IBGE. Cores só distinguem categorias.
 RACA:[{k:'b',n:'Branca'},{k:'p',n:'Preta'},{k:'a',n:'Amarela'},{k:'pa',n:'Parda'},{k:'i',n:'Indígena'}],
 AGES:['0–4','5–9','10–14','15–19','20–24','25–29','30–34','35–39','40–44','45–49','50–54','55–59','60–64','65–69','70–74','75–79','80+'],
 YEARS:[1980,1991,2000,2010,2022,2030,2040,2050,2060], CENSUS_YEAR:2022
};
