// Saldo de empregos com carteira (Novo Caged) de cada município do Brasil, mês a mês, no ano em curso.
// O saldo do mês é a soma da coluna "saldomovimentação" do arquivo CAGEDMOV do mês, por município —
// a mesma conta de scripts/caged-estados/ (que bate com os números oficiais por estado).
// Guarda os meses já calculados: a cada vez, só baixa os meses que ainda não estão no arquivo.
// Gera: dados/trabalho/brasil-municipios-caged.json
// Como rodar (na pasta statworld):  node scripts/caged-municipios/baixar.mjs
// Precisa de: curl (já vem no Windows 10/11) e do pacote 7zip-bin (instalado com "npm install").

import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { createReadStream, chmodSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const sete = createRequire(import.meta.url)('7zip-bin');

const FTP = 'ftp://ftp.mtps.gov.br/pdet/microdados/NOVO%20CAGED';
const SAIDA = new URL('../../dados/trabalho/brasil-municipios-caged.json', import.meta.url);
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nomeMes = (m) => `${MESES[Number(m.slice(4)) - 1]} de ${m.slice(0, 4)}`;
const listar = (url) => execFileSync('curl', ['-s', '-m', '60', '--list-only', url], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);

// 1. Meses do ano mais recente no servidor do Ministério.
const ano = String(Math.max(...listar(`${FTP}/`).filter((x) => /^\d{4}$/.test(x)).map(Number)));
const mesesServidor = listar(`${FTP}/${ano}/`).filter((x) => /^\d{6}$/.test(x)).sort();
if (!mesesServidor.length) throw new Error(`Não achei meses na pasta ${ano} do servidor do Novo Caged.`);

// 2. O que já foi calculado (só vale se for do mesmo ano).
const anterior = existsSync(SAIDA) ? JSON.parse(await readFile(SAIDA, 'utf8')) : null;
const meses = anterior?.ano === ano ? { ...anterior.meses } : {};
const faltam = mesesServidor.filter((m) => !meses[m]);
if (!faltam.length) console.log('Nenhum mês novo no servidor.');
if (process.platform !== 'win32') chmodSync(sete.path7za, 0o755);

// 3. Para cada mês que falta: baixa, soma o saldo por município (código IBGE de 6 dígitos no arquivo) e apaga.
for (const mes of faltam) {
  const arquivo = `CAGEDMOV${mes}.7z`;
  console.log(`Baixando ${arquivo} (cerca de 50 MB)...`);
  const pasta = join(tmpdir(), `caged-mun-${mes}`);
  await mkdir(pasta, { recursive: true });
  const zip = join(pasta, arquivo);
  execFileSync('curl', ['-s', '-m', '900', '-o', zip, `${FTP}/${ano}/${mes}/${arquivo}`]);
  execFileSync(sete.path7za, ['x', '-y', `-o${pasta}`, zip], { stdio: 'ignore' });
  const porMun = {};
  let cab = null, iComp, iMun, iSaldo;
  for await (const l of createInterface({ input: createReadStream(join(pasta, `CAGEDMOV${mes}.txt`), 'utf8') })) {
    const c = l.split(';');
    if (!cab) {
      cab = c;
      [iComp, iMun, iSaldo] = ['competênciamov', 'município', 'saldomovimentação'].map((n) => cab.indexOf(n));
      if ([iComp, iMun, iSaldo].some((i) => i < 0)) throw new Error('O arquivo do Caged mudou de formato (colunas inesperadas).');
      continue;
    }
    if (c[iComp] !== mes) continue; // só movimentações do próprio mês
    porMun[c[iMun]] = (porMun[c[iMun]] ?? 0) + Number(c[iSaldo]);
  }
  await rm(pasta, { recursive: true, force: true });
  meses[mes] = porMun;
  console.log(`  ${nomeMes(mes)}: ${Object.keys(porMun).length} municípios.`);
}

// 4. Acumulado do ano por município (soma dos meses). Código do arquivo tem 6 dígitos (sem o dígito verificador);
// o site junta pelo código de 7 dígitos do IBGE usando os 6 primeiros.
const lista = Object.keys(meses).sort();
const ultimo = lista.at(-1);
const noAno = {};
for (const m of lista) for (const [mun, v] of Object.entries(meses[m])) noAno[mun] = (noAno[mun] ?? 0) + v;

const saida = {
  _explicacao: 'Saldo de empregos com carteira (Novo Caged) por município, mês a mês no ano em curso. Chave = código do município com 6 dígitos (os 6 primeiros do código do IBGE). Gerado por scripts/caged-municipios/baixar.mjs. Não edite à mão. Município que não aparece num mês = nenhuma movimentação declarada no prazo.',
  pais: 'BR',
  nivel: 'municipio',
  ano,
  ultimoMes: ultimo,
  periodo: nomeMes(ultimo),
  periodoNoAno: `janeiro a ${nomeMes(ultimo)}`,
  baixadoEm: new Date().toISOString().slice(0, 10),
  frequencia: 'mensal',
  fontes: [{
    nome: 'Ministério do Trabalho e Emprego',
    publicacao: `Novo Caged, microdados de ${lista.map((m) => MESES[Number(m.slice(4)) - 1].slice(0, 3)).join(', ')}/${ano}`,
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/novo-caged',
    arquivo: `${FTP.replace('%20', ' ')}/${ano}/`,
  }],
  calculo: 'Cálculo do StatWorld com os microdados oficiais: soma do saldo (admissões menos desligamentos) das movimentações declaradas no prazo (arquivo CAGEDMOV) de cada município. O acumulado do ano é a soma dos meses; pode diferir um pouco do acumulado oficial, que inclui declarações fora do prazo e exclusões.',
  meses,
  noAno,
};
await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify(saida));
console.log(`Pronto: ${lista.length} meses de ${ano} (até ${nomeMes(ultimo)}), ${Object.keys(noAno).length} municípios.`);
