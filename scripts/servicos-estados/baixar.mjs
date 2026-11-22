// Baixa do IBGE (Contas Regionais, "Conta da produção") o valor adicionado bruto (VAB) das
// 7 atividades de serviços em cada estado, e o crescimento real de cada uma.
// Gera: dados/servicos/brasil-estados.json
// Como rodar (na pasta statworld):  node scripts/servicos-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx'); // leitor de planilhas Excel

// ---- O que muda a cada ano (confira no LEIA-ME) ----------------------------
const ANO = 2024;
const DATA_DIVULGACAO = '2026-11-13'; // mesma divulgação das Contas Regionais usadas na Visão geral
// ----------------------------------------------------------------------------

const URL_ZIP = `https://ftp.ibge.gov.br/Contas_Regionais/${ANO}/xls/Conta_da_Producao_2010_${ANO}_xls.zip`;
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const SAIDA = new URL('../../dados/servicos/brasil-estados.json', import.meta.url);

// Número da aba dentro de cada planilha de estado -> [identificador = nome do ícone, nome curto, grupo]
const M = 'mercado', P = 'publico';
const ATIVIDADES = {
  7: ['comercio', 'Comércio', M],
  8: ['transporte', 'Transporte, armazenagem e correio', M],
  9: ['informacao-comunicacao', 'Informação e comunicação', M],
  10: ['financeiras', 'Atividades financeiras e seguros', M],
  11: ['imobiliarias', 'Atividades imobiliárias', M],
  12: ['administracao-publica', 'Administração, educação e saúde públicas', P],
  13: ['outros-servicos', 'Outros serviços', M],
};

const r = await fetch(URL_ZIP);
if (!r.ok) throw new Error(`O IBGE respondeu com erro ${r.status} em ${URL_ZIP}`);
const zip = XLSX.CFB.read(Buffer.from(await r.arrayBuffer()), { type: 'buffer' });
const estados = await (await fetch(URL_ESTADOS)).json();
const siglaPorNome = new Map(estados.map((e) => [e.nome, e.sigla]));
const siglas = estados.map((e) => e.sigla).sort();
const vazio = () => Object.fromEntries(siglas.map((s) => [s, null]));

// Em cada aba, o bloco "Valor Adicionado Bruto" traz, por ano: valor corrente (coluna 5) e índice de volume (coluna 2).
function lerVAB(ws) {
  const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const ini = linhas.findIndex((l) => typeof l[0] === 'string' && l[0].startsWith('Valor Adicionado Bruto'));
  if (ini < 0) throw new Error('Não achei o bloco "Valor Adicionado Bruto"');
  const linha = linhas.slice(ini).find((l) => l[0] === ANO);
  if (!linha) throw new Error(`O bloco não tem o ano ${ANO}`);
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return { valor: num(linha[5]) === null ? null : linha[5] * 1e6, volume: num(linha[2]) };
}

const atividades = Object.fromEntries(Object.values(ATIVIDADES).map(([id, nome, grupo]) => [id, {
  id, nome, grupo, unidadeQuantidade: null, valores: vazio(), quantidades: vazio(), crescimento: vazio(),
}]));
let achados = 0;
for (const arq of zip.FileIndex.filter((f) => /Tabela\d+\.xls$/i.test(f.name))) {
  const wb = XLSX.read(arq.content, { type: 'buffer' });
  const primeira = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], { header: 1, defval: null });
  const sigla = siglaPorNome.get(String(primeira[3]?.[0] ?? '').trim());
  if (!sigla) continue; // regiões, Brasil, Amazônia Legal
  achados++;
  for (const [aba, [id]] of Object.entries(ATIVIDADES)) {
    const nomeAba = wb.SheetNames.find((n) => n.endsWith(`.${aba}`));
    if (!nomeAba) throw new Error(`Planilha de ${sigla}: não achei a aba ${aba}`);
    const { valor, volume } = lerVAB(wb.Sheets[nomeAba]);
    atividades[id].valores[sigla] = valor;
    atividades[id].crescimento[sigla] = volume === null ? null : Math.round((volume - 1) * 100000) / 1000; // % real
  }
}
if (achados !== 27) throw new Error(`Esperava 27 estados, achei ${achados}`);

const soma = (o) => (Object.values(o).every((v) => v === null) ? null : Object.values(o).reduce((t, v) => t + (v ?? 0), 0));
const lista = Object.values(atividades)
  .map((a) => ({ ...a, valorPais: soma(a.valores), quantidadePais: null }))
  .sort((x, y) => y.valorPais - x.valorPais);
const totalDe = (filtro) => Object.fromEntries(siglas.map((s) => {
  const vals = lista.filter((a) => filtro(a)).map((a) => a.valores[s]);
  return [s, vals.every((v) => v === null) ? null : vals.reduce((t, v) => t + (v ?? 0), 0)];
}));

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Serviços por estado e atividade: valor adicionado bruto (R$ correntes) e crescimento real (% sobre o ano anterior). Gerado por scripts/servicos-estados/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR',
  nivel: 'estado',
  periodo: String(ANO),
  baixadoEm: new Date().toISOString().slice(0, 10),
  fontes: [{
    nome: 'IBGE',
    publicacao: `Contas Regionais do Brasil ${ANO}, Conta da produção por atividade`,
    url: 'https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9054-contas-regionais-do-brasil.html',
    arquivo: URL_ZIP,
    dataDivulgacao: DATA_DIVULGACAO,
  }],
  totais: { tudo: totalDe(() => true), mercado: totalDe((a) => a.grupo === M), publico: totalDe((a) => a.grupo === P) },
  produtos: lista,
}));
console.log(`Pronto: ${lista.length} atividades de serviços em ${achados} estados (${ANO}) salvas em dados/servicos/brasil-estados.json`);
console.log('No país:', lista.map((a) => `${a.nome} R$ ${(a.valorPais / 1e9).toFixed(0)} bi`).join('; '));
