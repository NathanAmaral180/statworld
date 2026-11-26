// Página de estado (mapa dos municípios): junta a malha, as medidas e os textos de um estado.
// Nada aqui é exclusivo de São Paulo: o estado e os arquivos vêm de pais.estados.comPagina (src/config/paises/<pais>.json)
// e as abas e medidas de src/config/temas/economia-municipios.json. Design: design/rodada-5-estado/.
import cfg from '../config/temas/economia-municipios.json';
import { carregarDados, carregarTextos } from './dados';
import { formatar, preencher, quandoCurto, type Contexto, type OpcoesNumero } from '../componentes/mapa-ranking/visao';
import { temas } from './catalogo';

export const CFG: any = cfg;
type Valores = Record<string, number | null>;

// Nome do estado e a preposição ("de São Paulo", "da Bahia", "em São Paulo").
export function nomesDoEstado(pais: any, uf: string) {
  const geoBr = carregarDados<any>('geo', pais.arquivos.geo.estado);
  const u = geoBr.unidades.find((x: any) => x.sigla === uf);
  const prep = pais.estados.preposicao[uf] ?? 'de';
  const em = ({ do: 'no', da: 'na', de: 'em' } as Record<string, string>)[prep] ?? 'em';
  return { nome: u.nome, regiaoPais: u.regiao, de: `${prep} ${u.nome}`, em: `${em} ${u.nome}` };
}

// Todos os estados, por região do país, para a troca de estado na trilha.
export function listaEstados(pais: any) {
  const geoBr = carregarDados<any>('geo', pais.arquivos.geo.estado);
  return (pais.estados.regioesPais as string[]).map((r) => ({
    regiao: r,
    estados: geoBr.unidades
      .filter((u: any) => u.regiao === r)
      .map((u: any) => ({ uf: u.sigla, nome: u.nome, temPagina: !!pais.estados.comPagina[u.sigla] }))
      .sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR')),
  }));
}

// Situação de cada aba neste estado (com as trocas do próprio estado).
export function abaDoEstado(pais: any, uf: string, aba: string) {
  const base = CFG.abas[aba] ?? { situacao: 'sem' };
  const troca = pais.estados.comPagina[uf]?.abas?.[aba];
  return troca ? { ...base, ...troca } : base;
}

// Endereço da página do estado: /sp/economia e /sp/economia/<aba> (o mesmo final do endereço da aba no Brasil).
export function enderecoEstado(uf: string, aba = 'visao-geral') {
  const economia = temas.find((t) => t.id === 'economia') as any;
  const item = economia.abas.itens.find((a: any) => a.id === aba);
  const fim = aba === 'visao-geral' || !item?.href ? '' : item.href.replace(/^\/economia/, '');
  return `/${uf.toLowerCase()}/economia${fim}`;
}

// Abas no formato do componente Abas: todas que têm configuração no nível de estado ganham página.
export function abasDoEstado(pais: any, uf: string) {
  const economia = temas.find((t) => t.id === 'economia') as any;
  const grupo = Object.fromEntries(economia.abas.grupos.map((g: any) => [g.id, g]));
  return economia.abas.itens.map((a: any) => ({
    id: a.id, nome: a.nome, nomeCurto: a.nomeCurto,
    grupo: grupo[a.grupo]?.nome, grupoId: a.grupo, grupoCurto: grupo[a.grupo]?.nomeCurto ?? grupo[a.grupo]?.nome,
    href: CFG.abas[a.id] ? enderecoEstado(uf, a.id) : undefined,
    ativo: !!CFG.abas[a.id],
    hrefBrasil: a.href ? pais.caminho + a.href : undefined,
  }));
}

// ---------- malha ----------
// Caixa (x0,y0,x1,y1) de um caminho SVG feito só de M, L e Z (o formato dos scripts de mapa).
function caixa(d: string): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const m of d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
    const x = +m[1], y = +m[2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

export function malhaDoEstado(pais: any, uf: string) {
  const geo = carregarDados<any>('geo', pais.estados.comPagina[uf].arquivos.geo);
  const mun: Record<string, any> = {};
  for (const u of geo.unidades) {
    const b = caixa(u.caminho);
    mun[u.codigo] = { n: u.nome, d: u.caminho, c: u.centro, b, a: Math.round((b[2] - b[0]) * (b[3] - b[1])), r: u.codigoRegiao };
  }
  const regioes: Record<string, any> = {};
  for (const r of geo.regioes) regioes[r.codigo] = { n: r.nome, count: r.municipios, b: caixa(r.caminho) };
  return { w: geo.largura, h: geo.altura, mun, regioes, regB: geo.regioes.map((r: any) => r.caminho).join(''), fonte: geo.fonte };
}

// ---------- medidas ----------
const arquivoDe = (pais: any, uf: string, nome: string) => pais.estados.comPagina[uf].arquivos[nome];

// Lê os valores de uma medida, com período, fontes e o que mais a ficha precisa (posição no país, referência do estado).
function lerMedida(pais: any, uf: string, m: any, codigos: string[]) {
  const pasta = m.dados.pasta;
  const arq = carregarDados<any>(pasta, arquivoDe(pais, uf, m.dados.arquivo));
  const valores: Valores = {};
  let periodo = '', fontes: any[] = [], frequencia = 'anual', posBrasil: Record<string, number | null> | null = null, totalBrasil: number | null = null, observacao: string | undefined;
  let refEstado: number | null = null;
  if (m.dados.indicador) {
    const ind = arq.indicadores[m.dados.indicador];
    for (const c of codigos) valores[c] = ind.valores[c] ?? null;
    ({ periodo, fontes } = ind);
    frequencia = ind.frequencia ?? frequencia;
    posBrasil = ind.posicaoBrasil ?? null;
    totalBrasil = ind.totalBrasil ?? null;
  } else if (m.dados.setor) {
    // Parte de um setor: agro ÷ valor adicionado (4 setores); impostos ÷ PIB (valor adicionado + impostos).
    const s = arq.setores;
    const va = (x: any) => (x.agro == null || x.industria == null || x.servicos == null || x.adm == null ? null : x.agro + x.industria + x.servicos + x.adm);
    const parte = (x: any) => {
      const tot = va(x);
      if (tot == null || x[m.dados.setor] == null) return null;
      return m.dados.setor === 'impostos' ? x.impostos / (tot + x.impostos) : x[m.dados.setor] / tot;
    };
    let num = 0, den = 0;
    for (const c of codigos) {
      const x = s.valores[c];
      const p = x ? parte(x) : null;
      valores[c] = p == null ? null : Math.round(p * 10000) / 100;
      if (p != null) { const tot = va(x)!; num += m.dados.setor === 'impostos' ? x.impostos : x[m.dados.setor]; den += m.dados.setor === 'impostos' ? tot + x.impostos : tot; }
    }
    refEstado = den ? Math.round((num / den) * 10000) / 100 : null;
    periodo = s.periodo; fontes = s.fontes; frequencia = s.frequencia; observacao = s.observacao;
  } else if (m.dados.caged) {
    // Chave do Caged: código do município com 6 dígitos. Município sem movimentação declarada = 0 (não é "sem dado").
    for (const c of codigos) {
      const fonteMes = m.dados.caged === 'noAno' ? arq.noAno : arq.meses[arq.ultimoMes];
      valores[c] = fonteMes[c.slice(0, 6)] ?? 0;
    }
    periodo = m.dados.caged === 'noAno' ? arq.periodoNoAno : arq.periodo;
    fontes = arq.fontes; frequencia = arq.frequencia;
    observacao = arq.calculo;
  }
  // Referência do estado para a ficha.
  const comValor = codigos.map((c) => valores[c]).filter((v): v is number => v != null);
  let ref: { rotulo: string; valor: number } | null = null;
  if (m.referencia === 'media' && comValor.length) ref = { rotulo: 'Média dos municípios', valor: comValor.reduce((a, b) => a + b, 0) / comValor.length };
  if (m.referencia === 'estado' && refEstado != null) ref = { rotulo: 'Estado inteiro', valor: refEstado };
  if (m.referencia === 'razao') {
    // PIB por pessoa do estado = soma do PIB ÷ soma da população (população de cada cidade = PIB ÷ PIB por pessoa, números do IBGE).
    const pib = arq.indicadores[m.razaoCom].valores;
    let sPib = 0, sPop = 0;
    for (const c of codigos) if (pib[c] != null && valores[c]) { sPib += pib[c]; sPop += pib[c] / (valores[c] as number); }
    if (sPop) ref = { rotulo: 'Estado inteiro', valor: sPib / sPop };
  }
  return { valores, periodo, fontes, frequencia, posBrasil, totalBrasil, ref, observacao };
}

// 6 faixas com o mesmo número de municípios (quantis). Medida que pode ser negativa ("divergente") usa o zero como um dos cortes.
function cortesDe(vals: number[], divergente: boolean): number[] {
  const a = [...vals].sort((x, y) => x - y);
  if (!a.length) return [];
  const q = (p: number) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
  if (divergente && a[0] < 0 && a.at(-1)! > 0) {
    const neg = a.filter((v) => v < 0), pos = a.filter((v) => v > 0);
    const qn = (p: number) => neg[Math.min(neg.length - 1, Math.floor(p * neg.length))];
    const qp = (p: number) => pos[Math.min(pos.length - 1, Math.floor(p * pos.length))];
    return [qn(0.5), 0, qp(0.25), qp(0.5), qp(0.75)];
  }
  // Muitos zeros (ex.: cidades que não exportaram): o zero vira a primeira faixa e as outras 5 dividem quem tem valor.
  if (a[0] === 0 && a.filter((v) => v === 0).length >= a.length / 6) {
    const pos = a.filter((v) => v > 0);
    const qp = (p: number) => pos[Math.min(pos.length - 1, Math.floor(p * pos.length))];
    return [0, qp(0.25), qp(0.5), qp(0.75), qp(0.9)];
  }
  return [1, 2, 3, 4, 5].map((i) => q(i / 6));
}

export function medidasDoEstado(pais: any, uf: string, aba: string, codigos: string[]) {
  const ctxBase = contextoEstado(pais);
  const tema = abaDoEstado(pais, uf, aba);
  return (tema.medidas ?? []).map((m: any) => {
    const d = lerMedida(pais, uf, m, codigos);
    const ctx = m.moeda ? { ...ctxBase, moeda: m.moeda } : ctxBase;
    const fmt: OpcoesNumero = { formato: m.formato, casas: m.casas, compacto: m.compacto, sinal: m.sinal };
    const vals = codigos.map((c) => d.valores[c]).filter((v): v is number => v != null);
    const cortes = cortesDe(vals, !!m.divergente);
    // Legenda curta (como no mapa do Brasil): moeda só na primeira e na última faixa; no meio, "1,3–19,7 mi".
    const fmtLeg: OpcoesNumero = { ...fmt, compacto: true, casas: 1, minCasas: 0, sinal: false };
    const f = (v: number) => formatar(v, fmtLeg, ctx);
    const fSem = (v: number) => (m.formato === 'moeda' ? formatar(v, { ...fmtLeg, formato: 'numero' }, ctx) : f(v));
    const legenda = cortes.length === 5
      ? [cortes[0] === 0 && !m.divergente ? 'zero' : `até ${f(cortes[0])}`, ...[1, 2, 3, 4].map((i) => `${fSem(cortes[i - 1])}–${fSem(cortes[i])}`), `${f(cortes[4])} ou mais`]
      : [];
    const f0 = d.fontes[0];
    return {
      id: m.id, rotulo: m.rotulo, rotuloCurto: m.rotuloCurto, coluna: m.coluna,
      titulo: preencher(m.titulo, { periodo: d.periodo }), subtitulo: m.subtitulo,
      periodo: d.periodo, frequencia: d.frequencia,
      carimbo: f0 ? `${f0.nome}, ${f0.publicacao}${quandoCurto(f0, ctxBase)}` : '',
      fonteUrl: f0?.url, observacao: d.observacao,
      fmt, moeda: ctx.moeda, cortes, legenda, divergente: !!m.divergente,
      valores: d.valores,
      textos: Object.fromEntries(codigos.map((c) => [c, formatar(d.valores[c], fmt, ctx)])),
      posBrasil: d.posBrasil, totalBrasil: d.totalBrasil,
      ref: d.ref ? { rotulo: d.ref.rotulo, valor: d.ref.valor, texto: formatar(d.ref.valor, fmt, ctx) } : null,
    };
  });
}

export function contextoEstado(pais: any): Contexto {
  const n = pais.estados.nivel;
  return { idioma: pais.idioma, moeda: pais.moeda.codigo, textos: carregarTextos(pais.idioma), nivelSingular: n.singular, nivelPlural: n.plural };
}

// Número mais recente do estado (PIB mensal), para a linha de resumo do topo.
export function agoraDoEstado(pais: any, uf: string) {
  const arq = pais.estados.comPagina[uf].arquivos.atividade;
  if (!arq) return null;
  const a = carregarDados<any>('economia', arq);
  const p = a.pibMensal;
  const v = p?.ultimo?.noAno?.pib;
  if (v == null) return null;
  const ctx = contextoEstado(pais);
  const f0 = p.fontes[0];
  return {
    ano: p.ultimoMes.slice(0, 4),
    valor: formatar(v, { formato: 'percentual', casas: 1, sinal: true }, ctx),
    mes: p.periodo.replace(/ de \d{4}$/, ''),
    frequencia: p.frequencia,
    fonte: `${f0.nome}, ${f0.publicacao}${quandoCurto(f0, ctx)}`,
    observacao: p.observacao,
  };
}

// Entrada pelo mapa do Brasil: na ficha de cada estado com página, o botão "Ver os municípios de <estado>"
// (na mesma aba, quando ela tem mapa dos municípios; senão, a Visão geral do estado).
export function ligarEstados(pais: any, visoes: Record<string, any>, aba: string) {
  const com = pais.estados?.comPagina ?? {};
  for (const uf of Object.keys(com)) {
    const N = nomesDoEstado(pais, uf);
    const destino = abaDoEstado(pais, uf, aba).situacao === 'mun' ? aba : 'visao-geral';
    for (const v of Object.values(visoes)) {
      const f = v?.fichas?.[uf];
      if (f && !f.link) f.link = { texto: preencher(CFG.textos.verMunicipios, { deEstado: N.de }), url: enderecoEstado(uf, destino) };
    }
  }
  return visoes;
}

// Bandeiras do estado e dos municípios (scripts/bandeiras-municipios/). Sem o arquivo, a página fica sem bandeiras.
export function bandeirasDoEstado(pais: any, uf: string): Record<string, { arquivo: string; credito: string; pagina: string }> {
  const arq = pais.estados.comPagina[uf].arquivos.bandeiras;
  if (!arq) return {};
  try { return carregarDados<any>('geo', arq).bandeiras ?? {}; } catch { return {}; }
}
