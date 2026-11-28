// Tema Saúde: "Como as pessoas estão" (IBGE, Pesquisa Nacional de Saúde 2019, Sidra).
// Para cada assunto: % das pessoas de 18 anos ou mais, com o intervalo de confiança de 95% publicado pelo IBGE,
// no Brasil e nos estados, para o total, homens e mulheres. É uma pesquisa por amostra: só existe para Brasil e estados.
// Gera: dados/saude/brasil-pns.json
// Como rodar (na pasta statworld):  node scripts/saude-pns/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';

const API = 'https://servicodados.ibge.gov.br/api/v3/agregados';
const ANO = '2019';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(u) { for (let i = 1; i <= 6; i++) { const r = await fetch(u); if (r.ok) { const j = await r.json(); if (j) return j; } await espera(3000 * i); } throw new Error(`O IBGE não respondeu: ${u}`); }
const num = (v) => (v == null || v === '' || /^(-|X|\.\.\.?)$/.test(v) ? null : Number(v));

// Assuntos (tabela do Sidra, "por sexo e situação do domicílio"). grupo: como o design organiza.
const ASSUNTOS = [
  { id: 'autoavaliacao-boa', grupo: 'autoavaliacao', nome: 'Avaliam a própria saúde como boa ou muito boa', tabela: 4751 },
  { id: 'hipertensao', grupo: 'cronicas', nome: 'Pressão alta', detalhe: 'Diagnóstico de hipertensão por médico', tabela: 4418 },
  { id: 'diabetes', grupo: 'cronicas', nome: 'Diabetes', detalhe: 'Diagnóstico por médico', tabela: 4487 },
  { id: 'colesterol', grupo: 'cronicas', nome: 'Colesterol alto', detalhe: 'Diagnóstico por médico', tabela: 4547 },
  { id: 'depressao', grupo: 'cronicas', nome: 'Depressão', detalhe: 'Diagnóstico por profissional de saúde mental', tabela: 4694 },
  { id: 'asma', grupo: 'cronicas', nome: 'Asma', detalhe: 'Diagnóstico por médico', tabela: 4576 },
  { id: 'coracao', grupo: 'cronicas', nome: 'Doença do coração', detalhe: 'Diagnóstico por médico', tabela: 4578 },
  { id: 'fumam', grupo: 'habitos', nome: 'Fumam', detalhe: 'Fumantes atuais de tabaco', tabela: 4173 },
  { id: 'atividade-fisica', grupo: 'habitos', nome: 'Atividade física no tempo livre', detalhe: 'Nível recomendado de atividade física no lazer', tabela: 4250 },
  { id: 'frutas-hortalicas', grupo: 'habitos', nome: 'Comem frutas e hortaliças', detalhe: 'Consumo recomendado de hortaliças e frutas', tabela: 7668 },
  { id: 'alcool', grupo: 'habitos', nome: 'Bebem álcool', detalhe: 'Uma vez por semana ou mais', tabela: 4400 },
  { id: 'obesidade', grupo: 'habitos', nome: 'Obesidade', detalhe: 'Índice de massa corporal 30 ou mais, medido', tabela: 8168, variavel: /obesidade/i, extra: '58[95253]' },
];
const estados = await json('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
const sigla = (id) => (id === '1' ? 'BR' : estados.find((e) => String(e.id) === id)?.sigla);

const saida = {};
for (const a of ASSUNTOS) {
  const meta = await json(`${API}/${a.tabela}/metadados`);
  // Variáveis: o percentual e os limites do intervalo de confiança (as três primeiras "Percentual ..."; a de "Coeficiente" fica de fora).
  const pcts = meta.variaveis.filter((v) => /^Percentual/i.test(v.nome) && (!a.variavel || a.variavel.test(v.nome)));
  const [pv, inf, sup] = pcts;
  if (!pv) throw new Error(`Tabela ${a.tabela}: não achei a variável de percentual.`);
  const sexo = meta.classificacoes.find((c) => c.id === 2);
  const sit = meta.classificacoes.find((c) => c.id === 1);
  const cats = sexo.categorias.map((c) => c.id);
  const classif = [`2[${cats.join(',')}]`, sit ? `1[6795]` : null, a.extra ?? null].filter(Boolean).join('|');
  const niveis = meta.nivelTerritorial.Administrativo.includes('N3') ? 'N1[all]|N3[all]' : 'N1[all]';
  const resp = await json(`${API}/${a.tabela}/periodos/${ANO}/variaveis/${[pv, inf, sup].filter(Boolean).map((v) => v.id).join('|')}?localidades=${niveis}&classificacao=${classif}`);
  const nomeSexo = Object.fromEntries(sexo.categorias.map((c) => [String(c.id), /total/i.test(c.nome) ? 'total' : /masc|homen/i.test(c.nome) ? 'homens' : 'mulheres']));
  const v = {};
  for (const variavel of resp) {
    const campo = variavel.id === String(pv.id) ? 'pct' : variavel.id === String(inf?.id) ? 'inf' : 'sup';
    for (const res of variavel.resultados) {
      const sx = nomeSexo[Object.keys(res.classificacoes.find((c) => c.id === '2').categoria)[0]];
      for (const s of res.series) { const l = sigla(s.localidade.id); if (!l) continue; (((v[l] ??= {})[sx] ??= {})[campo] = num(s.serie[ANO])); }
    }
  }
  saida[a.id] = { ...a, tabela: undefined, variavel: undefined, extra: undefined, fonte: { nome: 'IBGE', publicacao: `Pesquisa Nacional de Saúde ${ANO} (tabela ${a.tabela})`, url: `https://sidra.ibge.gov.br/tabela/${a.tabela}` }, niveis: niveis.includes('N3') ? 'estados' : 'brasil', valores: v };
  console.log(`${a.nome}: Brasil ${v.BR?.total?.pct}% (${v.BR?.total?.inf}–${v.BR?.total?.sup})`);
  await espera(400);
}
const dir = new URL('../../dados/saude/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('brasil-pns.json', dir), JSON.stringify({
  _explicacao: 'Saúde: Pesquisa Nacional de Saúde (IBGE), % das pessoas de 18 anos ou mais, com intervalo de confiança de 95% (inf, sup). Brasil (BR) e estados; total, homens e mulheres. Gerado por scripts/saude-pns/baixar.mjs. Não edite à mão.',
  periodo: ANO, frequencia: 'pesquisa', baixadoEm: new Date().toISOString().slice(0, 10),
  nota: 'Pesquisa por amostra: cada número tem margem de erro (o intervalo). Não existe por município.', assuntos: saida,
}, null, 1));
console.log('Pronto.');
