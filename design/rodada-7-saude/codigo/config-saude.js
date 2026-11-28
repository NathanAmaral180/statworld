// Configuração do tema Saúde. Para outro país ou estado: troque este arquivo e as malhas (SW_GEO, SW_GEO_MUN); o molde não muda.
// Todos os números são de exemplo ("00,0"). Datas de divulgação também ficam em "00 mmm 0000" até a conferência.
window.SW_CFG = {
 theme:'Saúde', themes:['Economia','Saúde','Política','Demografia'],
 file:'Saúde.dc.html',
 links:{demografia:'#', expvida:'#', contas:'#'},
 country:{key:'BR', name:'Brasil', title:'A saúde do Brasil', Unit:'Estado', unit:'estado', units:'estados', regionLabel:'Região',
   regions:['Norte','Nordeste','Sudeste','Sul','Centro-Oeste'], def:'SP'},
 // estados com dados por município ligados
 sub:{SP:{key:'SP', name:'São Paulo', title:'A saúde de São Paulo', of:'de São Paulo', Unit:'Município', unit:'município', units:'municípios',
   regionLabel:'Região intermediária', flag:{light:'oklch(0.56 0.19 27)',dark:'oklch(0.68 0.17 27)'}, def:'3509502', ficha:'3507506'}},
 small:{avg3:20000, few:5000, rare:100000}, // limites de população: média de 3 anos; poucos casos; eventos raros (materna)
 years:{first:1996, last:2025, prel:1, final:2024},
 date:'00 mmm 0000',
 TABS:[
  {k:'geral', g:'Visão geral', s:'Visão geral', items:[['geral','Visão geral']]},
  {k:'vida', g:'Nascer e morrer', s:'Vida', items:[['obitos','Causas de morte'],['infantil','Mortalidade infantil e materna'],['nasc','Nascimentos'],['expvida','Esperança de vida']]},
  {k:'prev', g:'Prevenção e hábitos', s:'Prevenção', items:[['vac','Vacinação'],['doencas','Doenças acompanhadas'],['pns','Como as pessoas estão']]},
  {k:'cuid', g:'Atendimento', s:'Atendimento', items:[['rede','Rede de saúde'],['sus','Internações e procedimentos']]},
  {k:'rec', g:'Gasto e planos', s:'Gasto', items:[['gasto','Gasto público'],['planos','Planos de saúde']]}
 ],
 // o que cada aba tem em cada nível: ok | state (só o número do estado) | nodata (sem dado neste nível) | soon (em breve)
 avail:{pns:{mun:'state'}, rede_tempo:{uf:'ok',mun:'soon'}},
 src:{
  sim:'Ministério da Saúde, SIM', sinasc:'Ministério da Saúde, SINASC', pni:'Ministério da Saúde, SI-PNI', cnes:'Ministério da Saúde, CNES',
  sih:'Ministério da Saúde, SIH/SUS', sia:'Ministério da Saúde, SIA/SUS', sinan:'Ministério da Saúde, SINAN', siops:'Ministério da Saúde, SIOPS',
  ans:'ANS, Beneficiários', pns:'IBGE, Pesquisa Nacional de Saúde', pop:'IBGE, Estimativas de população', calc:'StatWorld, cálculo com CNES e IBGE'
 },
 // medidas de mapa: ph = como o número aparece; illus = forma ilustrativa das cores
 measures:{
  mort:{l:'Mortes', long:'Mortes por 100 mil habitantes, padronizadas por idade', h:'Mortes por 100 mil habitantes em 2024', unit:'por 100 mil', col:'Por 100 mil', ph:'000,0', src:'sim', ref:'2024', f:'anual', avg3:true,
   what:'Quantas pessoas morreram em um ano para cada 100 mil habitantes, como se todos os lugares tivessem a mesma distribuição de idade. Assim um lugar com mais idosos não aparece com taxa maior só por isso.'},
  inf:{l:'Mortalidade infantil', long:'Mortes antes de 1 ano de idade por mil nascidos vivos', h:'Mortalidade infantil em 2024', unit:'por mil nascidos vivos', col:'Por mil nasc.', ph:'00,0', src:'sim', ref:'2024', f:'anual', avg3:true,
   what:'Quantos bebês morreram antes de completar 1 ano para cada mil que nasceram vivos.'},
  mat:{l:'Mortalidade materna', long:'Mortes maternas por 100 mil nascidos vivos', h:'Mortalidade materna, média de 2022 a 2024', unit:'por 100 mil nascidos vivos', col:'Por 100 mil nasc.', ph:'00,0', src:'sim', ref:'2022–2024', f:'anual', rare:true,
   what:'Mortes de mulheres durante a gravidez, o parto ou até 42 dias depois, por causas ligadas à gestação, para cada 100 mil nascidos vivos. Como são poucos casos por ano, usamos a média de três anos e mostramos a faixa provável.'},
  med:{l:'Médicos', long:'Médicos por mil habitantes', h:'Médicos por mil habitantes', unit:'por mil habitantes', col:'Por mil hab.', ph:'0,0', src:'cnes', ref:'out 2026', f:'mensal',
   what:'Médicos com cadastro ativo em estabelecimentos de saúde do lugar, públicos e privados, para cada mil habitantes. Um médico que trabalha em dois lugares conta nos dois.'},
  enf:{l:'Enfermeiros', long:'Enfermeiros por mil habitantes', h:'Enfermeiros por mil habitantes', unit:'por mil habitantes', col:'Por mil hab.', ph:'0,0', src:'cnes', ref:'out 2026', f:'mensal', what:'Enfermeiros com cadastro ativo, para cada mil habitantes.'},
  leitos:{l:'Leitos SUS', long:'Leitos de internação do SUS por mil habitantes', h:'Leitos do SUS por mil habitantes', unit:'por mil habitantes', col:'Por mil hab.', ph:'0,0', src:'cnes', ref:'out 2026', f:'mensal', what:'Leitos de internação disponíveis para o SUS, para cada mil habitantes.'},
  leitosp:{l:'Leitos não SUS', long:'Leitos de internação fora do SUS por mil habitantes', h:'Leitos fora do SUS por mil habitantes', unit:'por mil habitantes', col:'Por mil hab.', ph:'0,0', src:'cnes', ref:'out 2026', f:'mensal', what:'Leitos de internação de hospitais privados ou de planos, sem convênio com o SUS, para cada mil habitantes.'},
  uti:{l:'Leitos de UTI', long:'Leitos de UTI por 10 mil habitantes', h:'Leitos de UTI por 10 mil habitantes', unit:'por 10 mil habitantes', col:'Por 10 mil hab.', ph:'0,0', src:'cnes', ref:'out 2026', f:'mensal', what:'Leitos de terapia intensiva, SUS e não SUS, para cada 10 mil habitantes.'},
  gasto:{l:'Gasto público', long:'Gasto público em saúde por habitante', h:'Gasto público em saúde por habitante em 2025', unit:'por habitante', col:'R$ por hab.', ph:'R$ 0.000', src:'siops', ref:'2025', f:'anual',
   what:'Quanto União, estado e município gastaram com saúde no lugar, dividido pela população. Não inclui o que as pessoas e as empresas pagam em planos e consultas particulares.'},
  planos:{l:'Planos de saúde', long:'Pessoas com plano de assistência médica, em % da população', h:'Parte da população com plano de saúde', unit:'% da população', col:'% da pop.', ph:'00,0%', src:'ans', ref:'set 2026', f:'mensal',
   what:'Beneficiários de planos de assistência médica, contados pelo município de residência informado no contrato, divididos pela população. Planos só odontológicos ficam de fora.'},
  vac:{l:'Vacinação infantil', long:'Cobertura média das vacinas do calendário infantil', h:'Cobertura vacinal infantil em 2025', unit:'% das crianças', col:'Cobertura', ph:'00,0%', src:'pni', ref:'2025', f:'anual', prel:true,
   what:'Média da cobertura das vacinas do calendário até 1 ano de idade: doses aplicadas divididas pelo número de crianças da idade.'},
  dengue:{l:'Dengue', long:'Casos prováveis de dengue por 100 mil habitantes, últimas 4 semanas', h:'Dengue nas últimas 4 semanas', unit:'por 100 mil', col:'Por 100 mil', ph:'00,0', src:'sinan', ref:'semanas 00 a 00', f:'semanal', prel:true, what:'Casos prováveis notificados nas últimas quatro semanas epidemiológicas, por 100 mil habitantes.'}
 },
 overview:['mort','inf','med','gasto'],
 causes:[
  {k:'circ', n:'Doenças do coração e da circulação', s:'Coração e circulação', cid:'I00–I99', c:'var(--c1)', w:27},
  {k:'cancer', n:'Câncer', s:'Câncer', cid:'C00–D48', c:'var(--c2)', w:17},
  {k:'ext', n:'Causas externas: acidentes e violência', s:'Causas externas', cid:'V01–Y98', c:'var(--c3)', w:11},
  {k:'resp', n:'Doenças respiratórias', s:'Respiratórias', cid:'J00–J99', c:'var(--c4)', w:11},
  {k:'endo', n:'Diabetes e outras doenças endócrinas', s:'Diabetes e endócrinas', cid:'E00–E90', c:'var(--c5)', w:6},
  {k:'dig', n:'Doenças digestivas', s:'Digestivas', cid:'K00–K93', c:'var(--c9)', w:5},
  {k:'inf', n:'Doenças infecciosas', s:'Infecciosas', cid:'A00–B99', c:'var(--c6)', w:4},
  {k:'nerv', n:'Doenças do sistema nervoso', s:'Sistema nervoso', cid:'G00–G99', c:'var(--c8)', w:4},
  {k:'covid', n:'Covid-19', s:'Covid-19', cid:'U07', c:'var(--c7)', w:2, from:2020},
  {k:'out', n:'Outras causas', s:'Outras', cid:'demais capítulos', c:'var(--bar)', w:9},
  {k:'mal', n:'Causa mal definida', s:'Mal definida', cid:'R00–R99', c:'hatch', w:4, quality:true}
 ],
 ages:[['0','Menos de 1 ano'],['1–14','1 a 14 anos'],['15–29','15 a 29 anos'],['30–49','30 a 49 anos'],['50–69','50 a 69 anos'],['70+','70 anos ou mais']],
 births:[
  {k:'pre', t:'Mães com 7 ou mais consultas de pré-natal', d:'Número de consultas declarado na declaração de nascido vivo.', w:74},
  {k:'ces', t:'Partos cesáreos', d:'Inclui cesáreas agendadas e de urgência.', w:58},
  {k:'ado', t:'Mães com até 19 anos', d:'Idade da mãe no dia do parto.', w:12},
  {k:'bp', t:'Bebês com menos de 2,5 kg', d:'Baixo peso ao nascer, pela classificação da OMS.', w:9}
 ],
 vaccines:[
  {k:'bcg', n:'BCG', a:'Ao nascer · tuberculose', meta:90, cov:.93},
  {k:'hepb', n:'Hepatite B', a:'Ao nascer, até 30 dias', meta:95, cov:.86},
  {k:'rota', n:'Rotavírus', a:'2 doses, até 4 meses', meta:90, cov:.88},
  {k:'pneumo', n:'Pneumocócica 10', a:'2 doses, até 4 meses', meta:95, cov:.90},
  {k:'meningo', n:'Meningocócica C', a:'2 doses, até 5 meses', meta:95, cov:.89},
  {k:'penta', n:'Pentavalente', a:'3 doses, até 6 meses', meta:95, cov:.87},
  {k:'polio', n:'Poliomielite', a:'3 doses, até 6 meses', meta:95, cov:.86},
  {k:'fa', n:'Febre amarela', a:'9 meses, onde é recomendada', meta:95, cov:.70},
  {k:'scr1', n:'Tríplice viral, 1ª dose', a:'12 meses · sarampo, caxumba, rubéola', meta:95, cov:.96},
  {k:'scr2', n:'Tríplice viral, 2ª dose', a:'15 meses', meta:95, cov:.78}
 ],
 diseases:[
  {k:'dengue', n:'Dengue', f:'semanal', src:'sinan', unit:'casos prováveis', weekly:true},
  {k:'chik', n:'Chikungunya', f:'semanal', src:'sinan', unit:'casos prováveis', weekly:true},
  {k:'tb', n:'Tuberculose', f:'anual', src:'sinan', unit:'casos novos'},
  {k:'aids', n:'Aids', f:'anual', src:'sinan', unit:'casos novos'},
  {k:'sifc', n:'Sífilis congênita', f:'anual', src:'sinan', unit:'casos por mil nascidos vivos'}
 ],
 pns:{
  self:[['Muito boa','var(--r4)'],['Boa','var(--r2)'],['Regular','var(--g1)'],['Ruim','var(--c9)'],['Muito ruim','var(--c8)']],
  groups:[['Brasil',''],['Mulheres','sexo'],['Homens','sexo'],['18 a 29 anos','idade'],['30 a 59 anos','idade'],['60 anos ou mais','idade']],
  chronic:[['Pressão alta','Diagnóstico de hipertensão por médico'],['Diabetes','Diagnóstico por médico'],['Colesterol alto','Diagnóstico por médico'],['Depressão','Diagnóstico por profissional de saúde mental'],['Asma','Diagnóstico por médico'],['Doença do coração','Diagnóstico por médico']],
  habits:[['Fumam','Cigarro ou outro produto do tabaco, hoje'],['Atividade física no tempo livre','150 minutos ou mais por semana'],['Comem frutas e hortaliças','5 dias ou mais por semana'],['Bebem álcool','Uma vez por semana ou mais'],['Obesidade','Índice de massa corporal 30 ou mais, medido']],
  year:'2019'
 },
 hosp:[['Gravidez e parto','O00–O99'],['Lesões e acidentes','S00–T98'],['Respiratórias','J00–J99'],['Coração e circulação','I00–I99'],['Digestivas','K00–K93'],['Infecciosas','A00–B99'],['Câncer','C00–D48'],['Urinárias e genitais','N00–N99']],
 travel:[['Até 15 min','var(--r1)'],['15 a 30 min','var(--r2)'],['30 a 60 min','var(--r3)'],['1 a 2 horas','var(--r4)'],['Mais de 2 horas','var(--r5)']],
 payers:[['União','var(--r4)'],['Estado','var(--r2)'],['Municípios','var(--r1)']],
 where:[['No próprio município','var(--r4)'],['Em outro município do estado','var(--r2)'],['Em outro estado','var(--r0)']]
};
