// Tema Saúde: rede de saúde (Ministério da Saúde, CNES, pelo TabNet do DATASUS), do mês mais recente.
//  - Médicos e enfermeiros com cadastro ativo em estabelecimentos de saúde (vínculos: quem trabalha em dois lugares conta nos dois).
//  - Leitos de internação SUS e não SUS; leitos de UTI (complementares).
// Brasil, estados e os municípios de um estado (UF, padrão SP), por mil habitantes (estimativa de população do IBGE).
// Gera: dados/saude/brasil-rede.json e dados/saude/brasil-<uf>-rede.json
// Como rodar (na pasta statworld):  node scripts/saude-rede/baixar.mjs

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { tabnet } from '../lib/tabnet.mjs';

const UF = (process.env.UF ?? 'SP').toUpperCase(), uf2 = UF.toLowerCase();
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const html = async (def) => Buffer.from(await (await fetch(`http://tabnet.datasus.gov.br/cgi/tabcgi.exe?${def}`)).arrayBuffer()).toString('latin1');
const estados = await (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')).json();
const siglaDe = Object.fromEntries(estados.map((e) => [String(e.id), e.sigla]));
const uf = (rot) => siglaDe[String(rot).slice(0, 2)] ?? null;
const mun6 = (rot) => (/^\d{6}/.test(rot) ? rot.slice(0, 6) : null);

// Mês mais recente (arquivos pfbrAAMM.dbf).
const defProf = await html('cnes/cnv/prid02br.def');
const aamm = [...defProf.matchAll(/VALUE="pfbr(\d{4})\.dbf"/g)].map((m) => m[1]).sort().at(-1);
const periodo = `${MESES[Number(aamm.slice(2)) - 1]} 20${aamm.slice(0, 2)}`;
console.log(`CNES: ${periodo}`);
// Códigos das ocupações (filtro do TabNet): todas as que começam com "Médico" e as de enfermeiro.
const decod = (s) => s.replace(/&eacute;/g, 'é').replace(/&atilde;/g, 'ã').replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó').replace(/&ccedil;/g, 'ç').trim();
const sel = defProf.slice(defProf.indexOf('NAME="SOcupa'), defProf.indexOf('</SELECT>', defProf.indexOf('NAME="SOcupa')));
const ocup = [...sel.matchAll(/VALUE="(\d+)">([^<]*)/g)].map((m) => [m[1], decod(m[2])]);
const MED = ocup.filter(([, n]) => /^Médico/.test(n) && !/veterin/i.test(n)).map(([v]) => v);
const ENF = ocup.filter(([, n]) => /^Enfermeiro|^Outros enfermeiros/.test(n)).map(([v]) => v);
if (MED.length < 20 || !ENF.length) throw new Error('Não achei as ocupações de médico e enfermeiro no TabNet.');
const FILTRO = 'SOcupações_em_geral';

async function nivel(sufixo, linha, chave) {
  const q = (def, arq, inc, filtros) => tabnet(def, { Linha: linha, Incremento: inc, Arquivos: [arq] }, filtros);
  const med = await q(`cnes/cnv/prid02${sufixo}.def`, `pf${sufixo}${aamm}.dbf`, 'Quantidade', { [FILTRO]: MED });
  const enf = await q(`cnes/cnv/prid02${sufixo}.def`, `pf${sufixo}${aamm}.dbf`, 'Quantidade', { [FILTRO]: ENF });
  const incSus = sufixo === 'br' ? ['Quantidade_SUS', 'Quantidade_Não_SUS'] : ['Qtd_SUS', 'Quantidade_Não_SUS'];
  const lei = await tabnet(`cnes/cnv/leiint${sufixo}.def`, { Linha: linha, Incremento: incSus, Arquivos: [`lt${sufixo}${aamm}.dbf`] });
  // Leitos de UTI: o campo se chama "Quantidade_existente" tanto no formulário do Brasil quanto no dos estados.
  const uti = await tabnet(`cnes/cnv/leiuti${sufixo}.def`, { Linha: linha, Incremento: 'Quantidade_existente', Arquivos: [`lu${sufixo}${aamm}.dbf`] });
  if (!uti.linhas.length) throw new Error(`O TabNet devolveu a tabela de UTI vazia (${sufixo}). Confira o nome do campo no formulário leiuti${sufixo}.def.`);
  const out = {};
  const pega = (t, i, campo) => { for (const l of t.linhas) { const k = chave(l[0]); if (k) (out[k] ??= {})[campo] = l[i] ?? 0; } };
  pega(med, 1, 'medicos'); pega(enf, 1, 'enfermeiros'); pega(lei, 1, 'leitosSus'); pega(lei, 2, 'leitosNaoSus'); pega(uti, 1, 'leitosUti');
  if (sufixo === 'br') out.BR = { medicos: med.total?.[1], enfermeiros: enf.total?.[1], leitosSus: lei.total?.[1], leitosNaoSus: lei.total?.[2], leitosUti: uti.total?.[1] };
  return out;
}
const br = await nivel('br', 'Unidade_da_Federação', uf);
const mun = await nivel(uf2, 'Município', mun6);

// Por habitante: estimativa de população do IBGE (scripts/populacao/).
const pUF = JSON.parse(await readFile(new URL('../../dados/demografia/brasil-estados.json', import.meta.url), 'utf8')).indicadores.estimativa;
const pMun = JSON.parse(await readFile(new URL('../../dados/demografia/brasil-municipios.json', import.meta.url), 'utf8')).indicadores.estimativa;
const r2 = (v) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);
// Um município que aparece numa tabela e não em outra (ex.: tem médicos, mas nenhum leito de UTI) tem 0 nessa outra.
const ZERO = { medicos: 0, enfermeiros: 0, leitosSus: 0, leitosNaoSus: 0, leitosUti: 0 };
const taxas = (x0, popul) => { const x = x0 && { ...ZERO, ...x0 }; return x && popul ? {
  ...x,
  medicosPorMil: r2((x.medicos / popul) * 1000), enfermeirosPorMil: r2((x.enfermeiros / popul) * 1000),
  leitosSusPorMil: r2((x.leitosSus / popul) * 1000), leitosNaoSusPorMil: r2((x.leitosNaoSus / popul) * 1000),
  utiPor10mil: r2((x.leitosUti / popul) * 10000),
} : null; };
const estSaida = Object.fromEntries(Object.entries(br).map(([l, x]) => [l, taxas(x, pUF.valores[l])]));
const cod7 = Object.keys(pMun.valores).filter((c) => c.startsWith(String(estados.find((e) => e.sigla === UF).id)));
const munSaida = Object.fromEntries(cod7.map((c) => [c, taxas(mun[c.slice(0, 6)] ?? { medicos: 0, enfermeiros: 0, leitosSus: 0, leitosNaoSus: 0, leitosUti: 0 }, pMun.valores[c])]));

const fontes = { cnes: { nome: 'Ministério da Saúde', publicacao: `CNES, Cadastro Nacional de Estabelecimentos de Saúde, ${periodo} (TabNet/DATASUS)`, url: 'http://tabnet.datasus.gov.br/cgi/deftohtm.exe?cnes/cnv/prid02br.def' }, pop: { nome: 'IBGE', publicacao: `Estimativas da população ${pUF.periodo}`, url: 'https://sidra.ibge.gov.br/tabela/6579' } };
const comum = { periodo, frequencia: 'mensal', baixadoEm: new Date().toISOString().slice(0, 10), fontes,
  calculo: 'Cálculo do StatWorld: profissionais e leitos do CNES ÷ população estimada pelo IBGE. Profissionais são vínculos: quem trabalha em dois estabelecimentos conta nos dois. Leitos de UTI: leitos complementares de terapia intensiva, SUS e não SUS.' };
const dir = new URL('../../dados/saude/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('brasil-rede.json', dir), JSON.stringify({ _explicacao: 'Saúde: rede de saúde, Brasil (BR) e estados. Gerado por scripts/saude-rede/baixar.mjs. Não edite à mão.', ...comum, valores: estSaida }, null, 1));
await writeFile(new URL(`brasil-${uf2}-rede.json`, dir), JSON.stringify({ _explicacao: `Saúde: rede de saúde, municípios de ${UF} (código do IBGE). Gerado por scripts/saude-rede/baixar.mjs. Não edite à mão. 0 = o CNES não registrou nenhum.`, ...comum, valores: munSaida }));
const b = estSaida.BR;
console.log(`Pronto (${periodo}). Brasil: ${b.medicosPorMil} médicos e ${b.enfermeirosPorMil} enfermeiros por mil; ${b.leitosSusPorMil} leitos SUS por mil; ${b.utiPor10mil} UTI por 10 mil. ${UF}: ${cod7.length} municípios.`);
