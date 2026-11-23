// Baixa os microdados do Novo Caged (Ministério do Trabalho e Emprego) do mês mais recente
// e calcula o SALDO de empregos com carteira (admissões menos desligamentos) de cada estado.
// O saldo é a soma da coluna "saldomovimentação" do arquivo CAGEDMOV do mês, por estado (coluna "uf").
// Conferido em set/2026: Brasil 121.305, SP 19.391, PE 13.371, AL 11.110, SC 7.086 — iguais aos números oficiais.
// Gera: dados/trabalho/brasil-caged.json
// Como rodar (na pasta statworld):  node scripts/caged-estados/baixar.mjs
// Precisa de: curl (já vem no Windows 10/11) e do pacote 7zip-bin (instalado com "npm install").

import { writeFile, mkdir, rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const sete = createRequire(import.meta.url)('7zip-bin'); // programa que abre arquivos .7z

// ---- O que atualizar a cada mês (confira no LEIA-ME) -----------------------
// O arquivo não diz quando o Ministério divulgou o mês. Ponha aqui a data da notícia oficial.
// Se o mês mais recente do servidor não estiver aqui, o site mostra o número sem a data e o script avisa.
const DIVULGACOES = {
  '202609': {
    data: '2026-11-04',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/novembro/pais-gerou-1-248-mil-empregos-formais-ate-setembro-de-2026',
  },
};
// ----------------------------------------------------------------------------

const FTP = 'ftp://ftp.mtps.gov.br/pdet/microdados/NOVO%20CAGED';
const SAIDA = new URL('../../dados/trabalho/brasil-caged.json', import.meta.url);
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const listar = (url) => execFileSync('curl', ['-s', '-m', '60', '--list-only', url], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);

// 1. Mês mais recente no servidor do Ministério.
const ano = String(Math.max(...listar(`${FTP}/`).filter((x) => /^\d{4}$/.test(x)).map(Number)));
const mes = listar(`${FTP}/${ano}/`).filter((x) => /^\d{6}$/.test(x)).sort().at(-1);
if (!mes) throw new Error(`Não achei meses na pasta ${ano} do servidor do Novo Caged.`);
const arquivo = `CAGEDMOV${mes}.7z`;
console.log(`Baixando ${arquivo} (cerca de 50 MB)...`);

// 2. Baixa e abre o arquivo numa pasta temporária.
const pasta = join(tmpdir(), `caged-${mes}`);
await mkdir(pasta, { recursive: true });
const zip = join(pasta, arquivo);
execFileSync('curl', ['-s', '-m', '900', '-o', zip, `${FTP}/${ano}/${mes}/${arquivo}`]);
execFileSync(sete.path7za, ['x', '-y', `-o${pasta}`, zip], { stdio: 'ignore' });
const txt = join(pasta, `CAGEDMOV${mes}.txt`);

// 3. Soma o saldo por estado (código IBGE da UF). Código 99 = estado não identificado (entra só no total do país).
const estados = await (await fetch(URL_ESTADOS)).json();
const siglaPorCodigo = new Map(estados.map((e) => [String(e.id), e.sigla]));
const porCodigo = {};
let total = 0, linhas = 0, cab = null;
const leitor = createInterface({ input: createReadStream(txt, 'utf8') });
for await (const l of leitor) {
  const c = l.split(';');
  if (!cab) {
    cab = c;
    if (cab[2] !== 'uf' || cab[6] !== 'saldomovimentação' || cab[0] !== 'competênciamov') throw new Error('O arquivo do Caged mudou de formato (colunas inesperadas).');
    continue;
  }
  if (c[0] !== mes) continue; // só movimentações do próprio mês
  const s = Number(c[6]);
  porCodigo[c[2]] = (porCodigo[c[2]] ?? 0) + s;
  total += s;
  linhas++;
}
await rm(pasta, { recursive: true, force: true });

const siglas = estados.map((e) => e.sigla).sort();
const valores = Object.fromEntries(siglas.map((s) => [s, null]));
for (const [cod, v] of Object.entries(porCodigo)) {
  const sigla = siglaPorCodigo.get(cod);
  if (sigla) valores[sigla] = v;
}
const naoIdentificado = porCodigo['99'] ?? 0;
const nomeMes = `${MESES[Number(mes.slice(4)) - 1]} de ${mes.slice(0, 4)}`;
const div = DIVULGACOES[mes];
if (!div) console.log(`Atenção: ponha em DIVULGACOES a data em que o Ministério divulgou ${nomeMes}.`);

const saida = {
  _explicacao: 'Saldo de empregos com carteira (Novo Caged) por estado, no mês mais recente. Gerado por scripts/caged-estados/baixar.mjs. Não edite à mão. null = sem dado.',
  pais: 'BR',
  nivel: 'estado',
  periodo: nomeMes,
  baixadoEm: new Date().toISOString().slice(0, 10),
  indicadores: {
    'caged-saldo': {
      nome: 'Empregos com carteira criados no mês (admissões menos desligamentos)',
      unidade: 'pessoas',
      periodo: nomeMes,
      frequencia: 'mensal',
      fontes: [{
        nome: 'Ministério do Trabalho e Emprego',
        publicacao: `Novo Caged, ${nomeMes}`,
        url: div?.url ?? 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/novo-caged',
        arquivo: `${FTP.replace('%20', ' ')}/${ano}/${mes}/${arquivo}`,
        dataDivulgacao: div?.data ?? null,
      }],
      calculo: `Cálculo do StatWorld com os microdados oficiais: soma do saldo das movimentações declaradas no prazo (arquivo CAGEDMOV) de cada estado. O total do país (${total}) inclui ${naoIdentificado} movimentações sem estado identificado.`,
      valorPais: total,
      valores,
    },
  },
};

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida, null, 2));
console.log(`Pronto: ${nomeMes}, ${linhas} movimentações. Saldo do Brasil: ${total}.`);
