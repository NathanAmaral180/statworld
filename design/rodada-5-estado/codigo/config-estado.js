// Configuração da página de estado. Nada aqui é exclusivo de São Paulo: o molde lê nomes, abas, medidas e fontes deste arquivo
// e a malha de SW_MUN[uf]. Para outro país (condados dos EUA, por exemplo), troque este arquivo e a malha.
// Valores são sempre textos de exemplo (00,0%); o selo "exemplo" aparece em toda tela.
window.SW_EST = (function(){
const PH_DATE = '00 mmm 0000';
const LEG = ['até 00','00 a 00','00 a 00','00 a 00','00 a 00','00 ou mais'];
const country = {name:'Brasil', home:'Brasil Visão geral.dc.html', unit:'município', units:'municípios', Unit:'Município',
  total:'5.570', nStates:27, states:'estados', region:'Região', regionKind:'regiões intermediárias',
  regionSrc:'IBGE, Divisão regional do Brasil em regiões geográficas intermediárias (2017)'};

/* Estado de cada aba neste nível:
   mun    = mapa dos municípios
   estado = só o número do estado (sem mapa dos municípios)
   none   = sem dado neste nível (só existe para o país)
   soon   = em breve (fonte existe, página ainda não feita)
   off    = não existe nem no Brasil (fica como na barra do Brasil) */
const tabs = {
  geral:{status:'mun', measures:[
    {k:'pc', label:'PIB por pessoa', col:'PIB por pessoa', title:'PIB por pessoa', sub:'Valor produzido no ano dividido pela população.', ph:'R$ 00.000', big:'R$ 00.000', diff:'00% acima', src:'IBGE, PIB dos Municípios', f:'anual', br:true},
    {k:'pib', label:'Tamanho da economia', col:'PIB', title:'PIB', sub:'Valor de tudo o que foi produzido no município no ano.', ph:'R$ 0,0 bi', big:'R$ 0,0<small>bi</small>', diff:'0,0 vezes', src:'IBGE, PIB dos Municípios', f:'anual', br:true},
    {k:'agro', label:'Peso do agro', col:'Agro no PIB', title:'Parte do agro no valor produzido', sub:'Agropecuária como parte do valor adicionado do município.', ph:'00,0%', big:'00,0<small>%</small>', diff:'+0,0 ponto', src:'IBGE, PIB dos Municípios', f:'anual', br:true}]},
  agro:{status:'mun', measures:[
    {k:'lav', label:'Valor das lavouras', col:'Valor', title:'Valor da produção das lavouras', sub:'Soma do valor de todas as lavouras colhidas no ano.', ph:'R$ 000 mi', big:'R$ 000<small>mi</small>', diff:'00% acima', src:'IBGE, Produção Agrícola Municipal', f:'anual', br:true},
    {k:'boi', label:'Rebanho bovino', col:'Cabeças', title:'Rebanho bovino', sub:'Cabeças de gado em 31 de dezembro.', ph:'000 mil', big:'000<small>mil</small>', diff:'00% acima', src:'IBGE, Pesquisa da Pecuária Municipal', f:'anual', br:true}]},
  ind:{status:'off'}, serv:{status:'off'},
  trab:{status:'estado', why:'A PNAD Contínua, pesquisa do IBGE que mede o desemprego, ouve uma amostra do estado inteiro e não tem tamanho para dar um número por cidade.',
    brasil:'Brasil Trabalho e renda.dc.html', measures:[
    {k:'des', label:'Desemprego', title:'Desemprego', sub:'Parte das pessoas que procuram trabalho e não encontram, por trimestre.', big:'0,0<small>%</small>', ph:'0,0%', avg:'Média do Brasil', diff:'0,0 ponto', prev:'Mesmo trimestre de 0000', src:'IBGE, PNAD Contínua', f:'trimestral'},
    {k:'renda', label:'Renda média do trabalho', title:'Renda média do trabalho', sub:'Quanto as pessoas ocupadas recebem por mês, em média.', big:'R$ 0.000', ph:'R$ 0.000', avg:'Média do Brasil', diff:'00% acima', prev:'Mesmo trimestre de 0000', src:'IBGE, PNAD Contínua', f:'trimestral'}]},
  precos:{status:'soon', src:'IBGE, IPCA da região metropolitana da capital; DIEESE, cesta básica da capital', brasil:'Brasil Preços.dc.html'},
  imp:{status:'mun', measures:[
    {k:'imp', label:'Impostos sobre produtos (% do PIB)', col:'Impostos / PIB', title:'Impostos sobre produtos no PIB', sub:'Peso dos impostos sobre produtos na economia do município. Não é a arrecadação.', ph:'00,0%', big:'00,0<small>%</small>', diff:'+0,0 ponto', src:'IBGE, PIB dos Municípios', f:'anual', br:true}]},
  com:{status:'mun', measures:[
    {k:'exp', label:'Exportações', col:'Exportações', title:'Exportações', sub:'Valor vendido ao exterior por empresas do município, em dólares.', ph:'US$ 000 mi', big:'US$ 000<small>mi</small>', diff:'00% acima', src:'Secex, Comex Stat por município', f:'mensal', br:false}]},
  din:{status:'none', why:'Câmbio, Selic, bolsa e juros do crédito são números do país inteiro. Nenhuma dessas séries é medida por estado ou por cidade.', brasil:'Brasil Dinheiro e juros.dc.html'},
  contas:{status:'soon', src:'Tesouro Nacional, Siconfi: contas do governo do estado e das prefeituras', brasil:'Brasil Contas públicas.dc.html'}
};

// Estados com malha carregada. tabs aqui sobrescreve o padrão acima só para aquele estado.
const states = {
  SP:{sel:'3550308', capital:'3550308'},
  RR:{sel:'1400100', capital:'1400100', tabs:{precos:{status:'none', why:'O IPCA e a cesta básica do DIEESE não são medidos em Roraima.', brasil:'Brasil Preços.dc.html'}}}
};

// Os 27, com preposição (para "A economia de…").
const names = {AC:['Acre','do'],AL:['Alagoas','de'],AP:['Amapá','do'],AM:['Amazonas','do'],BA:['Bahia','da'],CE:['Ceará','do'],DF:['Distrito Federal','do'],ES:['Espírito Santo','do'],GO:['Goiás','de'],MA:['Maranhão','do'],MT:['Mato Grosso','de'],MS:['Mato Grosso do Sul','de'],MG:['Minas Gerais','de'],PA:['Pará','do'],PB:['Paraíba','da'],PR:['Paraná','do'],PE:['Pernambuco','de'],PI:['Piauí','do'],RJ:['Rio de Janeiro','do'],RN:['Rio Grande do Norte','do'],RS:['Rio Grande do Sul','do'],RO:['Rondônia','de'],RR:['Roraima','de'],SC:['Santa Catarina','de'],SP:['São Paulo','de'],SE:['Sergipe','de'],TO:['Tocantins','do']};
const groups = ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];

return {page:'Estado.dc.html', country, tabs, states, names, groups, PH_DATE, LEG};
})();
