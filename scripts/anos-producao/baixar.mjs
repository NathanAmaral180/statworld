// Baixa os ANOS ANTIGOS do Agro (lavouras + pecuária) e da Indústria, para o seletor de ano do site.
// Roda os scripts de sempre (lavouras-estados, pecuaria-estados, industria-estados) uma vez por ano,
// salvando cada ano em dados/<tema>/anos/<arquivo>-<ano>.json. O ano mais recente continua no arquivo de sempre.
// Como rodar (na pasta statworld):  node scripts/anos-producao/baixar.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

// Primeiro ano de cada tema (por quê: ver LEIA-ME). O último ano antigo é o anterior ao do arquivo de sempre.
const TEMAS = [
  // Agro: as carnes (bovinos, suínos, frango) vêm da planilha do MAPA, que começa em 2017; lavouras e pecuária precisam ser do mesmo ano.
  { pasta: 'agro', desde: 2017, atual: 'dados/agro/brasil-estados-lavouras.json', scripts: [
    { script: 'scripts/lavouras-estados/baixar.mjs', arquivo: 'brasil-estados-lavouras' },
    { script: 'scripts/pecuaria-estados/baixar.mjs', arquivo: 'brasil-estados-pecuaria' },
  ] },
  // Indústria: série anterior da PIA (tabela 1849) começa em 2007.
  { pasta: 'industria', desde: 2007, atual: 'dados/industria/brasil-estados.json', scripts: [
    { script: 'scripts/industria-estados/baixar.mjs', arquivo: 'brasil-estados' },
  ] },
];

for (const t of TEMAS) {
  const ultimo = Number(JSON.parse(readFileSync(t.atual, 'utf8')).periodo);
  mkdirSync(`dados/${t.pasta}/anos`, { recursive: true });
  for (let ano = t.desde; ano < ultimo; ano++) {
    for (const s of t.scripts) {
      const saida = `dados/${t.pasta}/anos/${s.arquivo}-${ano}.json`;
      process.stdout.write(`${t.pasta} ${ano} (${s.arquivo})… `);
      execFileSync(process.execPath, [s.script], { env: { ...process.env, ANO: String(ano), SAIDA: saida }, stdio: ['ignore', 'pipe', 'inherit'] });
      console.log('ok');
    }
  }
}
console.log('Pronto: anos antigos salvos em dados/agro/anos e dados/industria/anos.');
