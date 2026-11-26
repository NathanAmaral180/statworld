// Baixa o PIB dos Municípios (IBGE) e prepara as medidas dos municípios de um estado.
// Gera: dados/economia/brasil-<uf>-municipios.json (ano mais recente + setores do último ano com setores)
//       dados/economia/brasil-<uf>-municipios-anos.json (PIB e PIB por pessoa, ano a ano)
// Como rodar (na pasta statworld):  node scripts/pib-municipios/baixar.mjs
// Outro estado (PowerShell):        $env:UF="MG"; node scripts/pib-municipios/baixar.mjs
// Precisa de: curl (já vem no Windows 10/11) e dos pacotes 7zip-bin e xlsx (instalados com "npm install").

import { writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sete = require('7zip-bin');
const XLSX = require('xlsx');

const UF = (process.env.UF ?? 'SP').toUpperCase();
// Edição mais recente. Trocar quando o IBGE divulgar uma nova (todo mês de dezembro).
const EDICAO = {
  pasta: '2022_2023',
  arquivo: 'base_de_dados_2010_2023_xlsx.zip',
  dataDivulgacao: '2025-12-19',
  noticia: 'https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/45548-municipios-dependentes-da-industria-extrativa-freiam-desconcentracao-economica-em-2023',
};
const URL_ZIP = `https://ftp.ibge.gov.br/Pib_Municipios/${EDICAO.pasta}/base/${EDICAO.arquivo}`;

// ---------- Baixar e abrir a planilha ----------
const pasta = join(tmpdir(), `pib-municipios-${EDICAO.pasta}`);
await rm(pasta, { recursive: true, force: true });
await mkdir(pasta, { recursive: true });
const zip = join(pasta, 'base.zip');
console.log(`Baixando ${URL_ZIP} (cerca de 20 MB)...`);
execFileSync('curl', ['-s', '-f', '-m', '600', '-o', zip, URL_ZIP]);
if (!existsSync(zip)) throw new Error('O arquivo do IBGE não foi baixado. Confira o endereço em EDICAO.');
if (process.platform !== 'win32') chmodSync(sete.path7za, 0o755);
execFileSync(sete.path7za, ['x', zip, `-o${pasta}`, '-y'], { stdio: 'ignore' });
const planilha = (await readdir(pasta)).find((n) => n.endsWith('.xlsx'));
if (!planilha) throw new Error('Não achei a planilha .xlsx dentro do arquivo do IBGE.');
const wb = XLSX.readFile(join(pasta, planilha));
const linhas = XLSX.utils.sheet_to_json(wb.Sheets['PIB dos Municípios'], { header: 1 });


// Colunas pelo título (se o IBGE mudar a ordem, o script continua achando).
const titulos = linhas[0].map((t) => String(t).replace(/\s+/g, ' ').trim());
const col = (comeco) => {
  const i = titulos.findIndex((t) => t.startsWith(comeco));
  if (i < 0) throw new Error(`Coluna não encontrada na planilha do IBGE: "${comeco}"`);
  return i;
};
const C = {
  ano: col('Ano'), uf: col('Sigla da Unidade da Federação'), codigo: col('Código do Município'), nome: col('Nome do Município'),
  agro: col('Valor adicionado bruto da Agropecuária'), industria: col('Valor adicionado bruto da Indústria'),
  servicos: col('Valor adicionado bruto dos Serviços'), adm: col('Valor adicionado bruto da Administração'),
  va: col('Valor adicionado bruto total'), impostos: col('Impostos, líquidos'),
  pib: col('Produto Interno Bruto, a preços'), porPessoa: col('Produto Interno Bruto per capita'),
  atividade1: col('Atividade com maior'), atividade2: col('Atividade com segundo'), atividade3: col('Atividade com terceiro'),
};
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const dados = linhas.slice(1).filter((r) => r[C.ano]);
const anos = [...new Set(dados.map((r) => String(r[C.ano])))].sort();
const ultimo = anos.at(-1);
// Último ano com o valor adicionado por setor (em 2022 e 2023 o IBGE só divulgou o PIB e o PIB por pessoa).
const anoSetores = [...anos].reverse().find((a) => dados.some((r) => String(r[C.ano]) === a && num(r[C.va]) != null));

const doAno = (a) => dados.filter((r) => String(r[C.ano]) === a);
const doEstado = (a) => doAno(a).filter((r) => r[C.uf] === UF);
const municipios = doEstado(ultimo);
if (!municipios.length) throw new Error(`Nenhum município de ${UF} em ${ultimo}`);
const nomeEstado = municipios[0][col('Nome da Unidade da Federação')];

// Posição entre todos os municípios do Brasil (1º = maior). Sem dado fica fora, nunca vira zero.
function posicoes(linhasAno, coluna) {
  const ord = linhasAno.filter((r) => num(r[coluna]) != null).sort((a, b) => num(b[coluna]) - num(a[coluna]));
  return { total: ord.length, pos: Object.fromEntries(ord.map((r, i) => [String(r[C.codigo]), i + 1])) };
}
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100);
const r4 = (n) => (n == null ? null : Math.round(n * 10000) / 10000);
const porCodigo = (lista, f) => Object.fromEntries(lista.map((r) => [String(r[C.codigo]), f(r)]));

const fonte = {
  nome: 'IBGE',
  publicacao: `PIB dos Municípios ${EDICAO.pasta.replace('_', '–')}`,
  url: EDICAO.noticia,
  arquivo: URL_ZIP,
  dataDivulgacao: EDICAO.dataDivulgacao,
};
const totalEstado = municipios.reduce((s, r) => s + (num(r[C.pib]) ?? 0), 0);
if (municipios.some((r) => num(r[C.pib]) == null)) throw new Error('Há município sem PIB: o total do estado ficaria errado.');
const posPib = posicoes(doAno(ultimo), C.pib);
const posPessoa = posicoes(doAno(ultimo), C.porPessoa);

const indicadores = {
  pib: {
    nome: 'PIB', unidade: 'moeda', periodo: ultimo, frequencia: 'anual', fontes: [fonte],
    calculo: 'Valor publicado pelo IBGE (em R$ mil na planilha; aqui em R$).',
    valores: porCodigo(municipios, (r) => Math.round(num(r[C.pib]) * 1000)),
    posicaoBrasil: porCodigo(municipios, (r) => posPib.pos[String(r[C.codigo])] ?? null),
    totalBrasil: posPib.total,
    valorEstado: Math.round(totalEstado * 1000),
  },
  'peso-pib-estado': {
    nome: `Participação no PIB de ${nomeEstado}`, unidade: '%', periodo: ultimo, frequencia: 'anual', fontes: [fonte],
    calculo: 'Cálculo do StatWorld: PIB do município ÷ soma do PIB dos municípios do estado × 100 (o IBGE publica o mesmo número, com 2 casas, na tabela 5938 do Sidra).',
    valores: porCodigo(municipios, (r) => r4((num(r[C.pib]) / totalEstado) * 100)),
  },
  'pib-por-pessoa': {
    nome: 'PIB por pessoa', unidade: 'moeda', periodo: ultimo, frequencia: 'anual', fontes: [fonte],
    // Texto conferido nas notas da planilha do IBGE (edição 2022–2023). Revisar a cada edição nova.
    calculo: 'Valor publicado pelo IBGE. Em 2022 e 2023 o IBGE usou a população do Censo 2022, porque não publicou estimativa de população para esses anos.',
    valores: porCodigo(municipios, (r) => r2(num(r[C.porPessoa]))),
    posicaoBrasil: porCodigo(municipios, (r) => posPessoa.pos[String(r[C.codigo])] ?? null),
    totalBrasil: posPessoa.total,
  },
};

// Setores (composição do valor adicionado) do último ano em que o IBGE os divulgou.
let setores = null;
if (anoSetores) {
  const doAnoSetores = doEstado(anoSetores);
  const nomes = { agro: 'Agropecuária', industria: 'Indústria', servicos: 'Serviços (sem a administração pública)', adm: 'Administração pública, defesa, educação e saúde públicas' };
  setores = {
    periodo: anoSetores, frequencia: 'anual', fontes: [fonte], unidade: 'moeda',
    observacao: `Em ${anos.filter((a) => a > anoSetores).join(' e ')} o IBGE divulgou só o PIB e o PIB por pessoa dos municípios, sem a divisão por setor (nota técnica 02/2024 do Sistema de Contas Nacionais). Por isso os setores são de ${anoSetores}.`,
    nomes,
    valores: porCodigo(doAnoSetores, (r) => ({
      agro: num(r[C.agro]) == null ? null : Math.round(num(r[C.agro]) * 1000),
      industria: num(r[C.industria]) == null ? null : Math.round(num(r[C.industria]) * 1000),
      servicos: num(r[C.servicos]) == null ? null : Math.round(num(r[C.servicos]) * 1000),
      adm: num(r[C.adm]) == null ? null : Math.round(num(r[C.adm]) * 1000),
      impostos: num(r[C.impostos]) == null ? null : Math.round(num(r[C.impostos]) * 1000),
      atividades: [r[C.atividade1], r[C.atividade2], r[C.atividade3]].filter(Boolean),
    })),
    notaAtividades: 'As 3 atividades com maior valor adicionado vêm prontas do IBGE, entre 10 atividades ("Demais serviços" junta transporte, informação, finanças, imobiliárias, serviços profissionais, educação e saúde privadas e outros).',
  };
}

const arquivo = `brasil-${UF.toLowerCase()}-municipios`;
const saida = {
  _explicacao: `Medidas de economia dos municípios de ${nomeEstado}. Gerado por scripts/pib-municipios/baixar.mjs. Não edite à mão. null = sem dado. Chave de cada valor = código do município no IBGE.`,
  pais: 'BR', estado: UF, nivel: 'municipio', periodo: ultimo,
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores,
  setores,
};

// Série de anos (PIB e PIB por pessoa a preços correntes, sem correção pela inflação).
const serie = {
  _explicacao: `PIB e PIB por pessoa dos municípios de ${nomeEstado}, ano a ano, em reais de cada ano (sem correção pela inflação). Gerado por scripts/pib-municipios/baixar.mjs. Não edite à mão.`,
  estado: UF, anos, fontes: [fonte], baixadoEm: saida.baixadoEm,
  porAno: Object.fromEntries(anos.map((a) => {
    const ls = doEstado(a);
    return [a, {
      pib: porCodigo(ls, (r) => (num(r[C.pib]) == null ? null : Math.round(num(r[C.pib]) * 1000))),
      'pib-por-pessoa': porCodigo(ls, (r) => r2(num(r[C.porPessoa]))),
    }];
  })),
};

const dir = new URL('../../dados/economia/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL(`${arquivo}.json`, dir), JSON.stringify(saida, null, 1));
await writeFile(new URL(`${arquivo}-anos.json`, dir), JSON.stringify(serie));
await rm(pasta, { recursive: true, force: true });
console.log(`Pronto: ${municipios.length} municípios de ${nomeEstado} (${ultimo}; setores de ${anoSetores}) salvos em dados/economia/${arquivo}.json`);
console.log(`Série de ${anos[0]} a ${ultimo} salva em dados/economia/${arquivo}-anos.json`);
