// Roda, em sequência, os scripts de dados que precisam de atualização frequente, e mostra um resumo.
// Usado pela rotina automática do GitHub (.github/workflows/atualizar-dados.yml) e também à mão.
//
// Como rodar (na pasta statworld):
//   node scripts/atualizar/rodar.mjs            -> os scripts "diários"
//   node scripts/atualizar/rodar.mjs --semanal  -> os diários + os semanais (ex.: Novo Caged, arquivo grande)
//
// Regras:
//  - Se um script falhar, os outros continuam; o arquivo daquele script fica como estava (os scripts só gravam no fim, se deu tudo certo).
//  - Se o único que mudou num arquivo foi a data da consulta ("baixadoEm", "dataConsulta"), o arquivo volta a ser o antigo:
//    assim o site só é publicado de novo quando algum NÚMERO mudou.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Cada script, a frequência com que roda e os arquivos de dados que ele grava.
const SCRIPTS = [
  { nome: 'Faixa "Agora" (dólar, Selic, IPCA)', script: 'brasil-agora', quando: 'diario', arquivos: ['dados/agora/brasil.json'] },
  { nome: 'Dinheiro e juros (Banco Central)', script: 'dinheiro', quando: 'diario', arquivos: ['dados/dinheiro/brasil-series.json'] },
  { nome: 'Preços (IPCA, cesta básica, salário mínimo)', script: 'precos', quando: 'diario', arquivos: ['dados/precos/brasil-ipca.json', 'dados/precos/brasil-estados.json', 'dados/precos/brasil-sm-cestas.json'] },
  { nome: 'Trabalho e renda (PNAD Contínua)', script: 'trabalho-estados', quando: 'diario', arquivos: ['dados/trabalho/brasil-estados.json', 'dados/trabalho/brasil-series.json'] },
  { nome: 'Comércio exterior (Comex Stat)', script: 'comercio', quando: 'diario', arquivos: ['dados/comercio/brasil-estados.json', 'dados/comercio/brasil-listas.json', 'dados/comercio/brasil-balanca.json'] },
  { nome: 'Contas públicas (Tesouro, Banco Central)', script: 'contas-publicas', quando: 'diario', arquivos: ['dados/contas-publicas/brasil-r100.json', 'dados/contas-publicas/brasil-divida.json', 'dados/contas-publicas/brasil-cofog.json'] },
  { nome: 'Empregos com carteira (Novo Caged)', script: 'caged-estados', quando: 'semanal', arquivos: ['dados/trabalho/brasil-caged.json'] },
];

const semanal = process.argv.includes('--semanal');
const escolhidos = SCRIPTS.filter((s) => s.quando === 'diario' || semanal);

// Tira os campos que só dizem QUANDO o script rodou, para comparar só os números.
const semDatas = (texto) => {
  try {
    return JSON.stringify(JSON.parse(texto), (k, v) => (k === 'baixadoEm' || k === 'dataConsulta' ? undefined : v));
  } catch {
    return texto;
  }
};

const resultados = [];
for (const s of escolhidos) {
  const antes = Object.fromEntries(s.arquivos.map((a) => [a, existsSync(join(RAIZ, a)) ? readFileSync(join(RAIZ, a), 'utf8') : null]));
  console.log(`\n=== ${s.nome} (scripts/${s.script}) ===`);
  const inicio = Date.now();
  const r = spawnSync(process.execPath, [join(RAIZ, 'scripts', s.script, 'baixar.mjs')], { cwd: RAIZ, encoding: 'utf8', timeout: 20 * 60 * 1000 });
  const saida = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  console.log(saida);
  const ok = r.status === 0;
  const avisos = saida.split('\n').filter((l) => /^Atenção/i.test(l.trim()));
  // Arquivo que só mudou na data da consulta volta a ser o antigo.
  const mudaram = [];
  for (const a of s.arquivos) {
    const agora = existsSync(join(RAIZ, a)) ? readFileSync(join(RAIZ, a), 'utf8') : null;
    if (antes[a] !== null && agora !== null && antes[a] !== agora && semDatas(antes[a]) === semDatas(agora)) writeFileSync(join(RAIZ, a), antes[a]);
    else if (antes[a] !== agora) mudaram.push(a);
  }
  resultados.push({ nome: s.nome, ok, mudaram, avisos, segundos: Math.round((Date.now() - inicio) / 1000), erro: ok ? '' : saida.split('\n').filter(Boolean).at(-1) ?? `código ${r.status}` });
}

// Resumo (no terminal e, no GitHub, na página da execução).
const linhas = [
  '| Dados | Resultado | Arquivos com números novos | Avisos |',
  '|---|---|---|---|',
  ...resultados.map((r) => `| ${r.nome} | ${r.ok ? 'ok' : 'FALHOU: ' + r.erro.replace(/\|/g, '/')} | ${r.mudaram.length ? r.mudaram.join('<br>') : '—'} | ${r.avisos.join('<br>').replace(/\|/g, '/') || '—'} |`),
];
console.log('\n' + linhas.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Atualização dos dados\n\n${linhas.join('\n')}\n`);

// No GitHub, cada resultado vira também uma nota na página da execução (fácil de ver sem abrir o registro completo).
if (process.env.GITHUB_ACTIONS) {
  for (const r of resultados) {
    const tipo = r.ok ? (r.avisos.length ? 'warning' : 'notice') : 'error';
    const msg = r.ok
      ? `${r.nome}: ok, ${r.mudaram.length ? 'números novos em ' + r.mudaram.join(', ') : 'sem números novos'}${r.avisos.length ? '. ' + r.avisos.join(' ') : ''}`
      : `${r.nome}: FALHOU (${r.erro})`;
    console.log(`::${tipo} title=Dados::${msg.replace(/\n/g, ' ')}`);
  }
}

const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas} de ${resultados.length} scripts deram certo; ${resultados.reduce((t, r) => t + r.mudaram.length, 0)} arquivos com números novos.`);
// Só termina com erro se TODOS falharam (aí algo está errado com a rede ou com a máquina).
process.exit(falhas === resultados.length ? 1 : 0);
