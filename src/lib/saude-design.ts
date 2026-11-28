// Monta, com os NOSSOS dados (dados/saude/, dados/demografia/), o objeto que o código das telas de Saúde do design
// da rodada 7 espera (window.SW_SAUDE). As telas são as do design (public/saude/js/molde-saude.js), e cada número
// que no design era de exemplo vem daqui. Chaves por lugar: "__BR" (país), "__p" (o estado, nas páginas do estado),
// siglas dos estados (nível Brasil) ou códigos de 7 dígitos dos municípios (nível estado).
import { carregarDados } from './dados';
import cfgBase from '../config/temas/saude-design.json';

const r1 = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);
const r2 = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);
const soma = (a: (number | null | undefined)[]) => { const b = a.filter((x): x is number => x != null); return b.length ? b.reduce((s, x) => s + x, 0) : null; };
const media = (a: (number | null | undefined)[]) => { const b = a.filter((x): x is number => x != null); return b.length ? b.reduce((s, x) => s + x, 0) / b.length : null; };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const dataBr = (iso: string) => { const [a, m, d] = iso.split('-').map(Number); return `${d} ${MESES[m - 1]} ${a}`; };
// Faixa provável de uma taxa com poucos casos (aproximação de Byar para contagens de Poisson, 95%).
const byar = (n: number) => ({ lo: n === 0 ? 0 : n * (1 - 1 / (9 * n) - 1.96 / (3 * Math.sqrt(n))) ** 3, hi: (n + 1) * (1 - 1 / (9 * (n + 1)) + 1.96 / (3 * Math.sqrt(n + 1))) ** 3 });

export function configSaude(pais: any, uf?: string) {
  const c: any = structuredClone(cfgBase);
  // Só os estados com página por município aparecem como "sub" (hoje, SP); cor de destaque = a da bandeira (brasil.json).
  for (const k of Object.keys(c.sub)) {
    const cp = pais.estados?.comPagina?.[k];
    if (!cp) { delete c.sub[k]; continue; }
    c.sub[k].flag = { light: cp.destaque.claro, dark: cp.destaque.escuro };
  }
  c.lv = uf ?? 'BR';
  return c;
}

export function dadosSaude(pais: any, uf?: string) {
  const cfg = configSaude(pais, uf);
  const A = pais.arquivos.saude;
  const vital = carregarDados<any>('saude', A.vital), rede = carregarDados<any>('saude', A.rede);
  const planos = carregarDados<any>('saude', A.planos), pns = carregarDados<any>('saude', A.pns);
  const popUF = carregarDados<any>('demografia', pais.arquivos.demografia.estado).indicadores;
  const proj = carregarDados<any>('demografia', pais.arquivos.demografia.series).projecao.valores;
  const anos: number[] = vital.anos, Y1 = vital.anoFinal;
  const tres = [Y1 - 2, Y1 - 1, Y1];
  const causas = cfg.causes as { k: string; cap: string[] }[];
  const sm = cfg.small;

  // Lê um registro de "nascer e morrer" de um lugar em um ano.
  type Reg = any;
  const vUF = (l: string, a: number): Reg => vital.valores[String(a)]?.[l] ?? null;
  const porCausa = (r: Reg) => r ? Object.fromEntries(causas.map((c) => [c.k, soma(c.cap.map((x) => r.obitosPorCapitulo?.[x] ?? null)) ?? 0])) : null;
  const juntaCausas = (rs: Reg[]) => { const p = rs.map(porCausa).filter(Boolean) as Record<string, number>[]; return p.length ? Object.fromEntries(causas.map((c) => [c.k, p.reduce((s, x) => s + x[c.k], 0)])) : null; };

  // Monta a ficha numérica de um lugar. pop(a) = população no ano a (para as taxas brutas).
  function lugar(get: (a: number) => Reg, pop: (a: number) => number | null, popAtual: number | null, extra: any, pequeno: { avg3: boolean; few: boolean; rare: boolean }) {
    const r = get(Y1), r3 = tres.map(get);
    const nasc3 = soma(r3.map((x) => x?.nascimentos)), mat3 = soma(r3.map((x) => x?.obitosMaternos));
    const mort = pequeno.avg3 ? media(r3.map((x) => x?.mortesPadronizadas)) : r?.mortesPadronizadas;
    const inf = pequeno.avg3 ? (nasc3 ? (soma(r3.map((x) => x?.obitosInfantis))! / nasc3) * 1000 : null) : r?.mortalidadeInfantil;
    const ci = mat3 != null && nasc3 ? byar(mat3) : null;
    const cz = porCausa(r), cz3 = juntaCausas(r3);
    const p = pop(Y1);
    const bruta = (cz: any, pp: number | null, nAnos = 1) => cz && pp ? Object.fromEntries(Object.entries(cz).map(([k, n]) => [k, r1(((n as number) / nAnos / pp) * 1e5)])) : null;
    const serie = (f: (x: Reg, a: number) => number | null) => anos.map((a) => { const x = get(a); return x ? r1(f(x, a)) : null; });
    return {
      pop: popAtual,
      mort: r1(mort), inf: r1(inf),
      mat: r1(mat3 != null && nasc3 ? (mat3 / nasc3) * 1e5 : null), matN: mat3, matLo: ci && nasc3 ? r1((ci.lo / nasc3) * 1e5) : null, matHi: ci && nasc3 ? r1((ci.hi / nasc3) * 1e5) : null,
      nasc: r?.nascimentos ?? null, nasc3, obitos: r?.obitos ?? null, obitos3: soma(r3.map((x) => x?.obitos)),
      pre: r?.preNatal7 ?? null, ces: r?.cesareas ?? null, ado: r?.maesAte19 ?? null, bp: r?.baixoPeso ?? null,
      causas: cz, causas3: cz3, // contagens: ano final e soma dos 3 anos
      bruta: pequeno.avg3 ? bruta(cz3, p, 3) : bruta(cz, p),
      ser: {
        mort: serie((x) => x.mortesPadronizadas), inf: serie((x) => x.mortalidadeInfantil),
        mat: serie((x) => (x.nascimentos ? (x.obitosMaternos / x.nascimentos) * 1e5 : null)), births: anos.map((a) => get(a)?.nascimentos ?? null),
        ...Object.fromEntries(causas.map((c) => [c.k, serie((x, a) => { const pp = pop(a); const n = porCausa(x)![c.k]; return pp ? (n / pp) * 1e5 : null; })])),
      },
      ...extra,
    };
  }
  const redeDe = (x: any) => ({ med: r1(x?.medicosPorMil), enf: r1(x?.enfermeirosPorMil), leitos: r2(x?.leitosSusPorMil), leitosp: r2(x?.leitosNaoSusPorMil), uti: r1(x?.utiPor10mil) });
  const nada = { avg3: false, few: false, rare: false };
  const ufLugar = (s: string) => lugar((a) => vUF(s, a), (a) => proj[s]?.[String(a)]?.pop ?? null, popUF.estimativa.valores[s] ?? null,
    { ...redeDe(rede.valores[s]), planos: planos.valores[s]?.pctPopulacao ?? null, beneficiarios: planos.valores[s]?.beneficiarios ?? null }, nada);

  const v: Record<string, any> = { __BR: ufLugar('BR') };
  let ids: string[];
  if (!uf) {
    ids = Object.keys(popUF.estimativa.valores).filter((k) => k !== 'BR');
    for (const s of ids) v[s] = ufLugar(s);
  } else {
    const arq = pais.estados.comPagina[uf].arquivos;
    const vm = carregarDados<any>('saude', arq.saudeVital), rm = carregarDados<any>('saude', arq.saudeRede), pm = carregarDados<any>('saude', arq.saudePlanos);
    const popM = carregarDados<any>('demografia', arq.demografia).indicadores;
    v.__p = ufLugar(uf);
    ids = Object.keys(pm.valores);
    for (const m of ids) {
      const pAtual = popM.estimativa.valores[m] ?? null, pAnt = popM['estimativa-anterior']?.valores[m] ?? pAtual;
      const pq = { avg3: (pAtual ?? 0) < sm.avg3, few: (pAtual ?? 0) < sm.few, rare: (pAtual ?? 0) < sm.rare };
      v[m] = lugar((a) => vm.valores[String(a)]?.[m] ?? null, () => pAnt, pAtual,
        { ...redeDe(rm.valores[m]), planos: pm.valores[m]?.pctPopulacao ?? null, beneficiarios: pm.valores[m]?.beneficiarios ?? null }, pq);
    }
  }
  // Pesquisa Nacional de Saúde: só país e estados.
  const P: any = {};
  for (const [id, a] of Object.entries<any>(pns.assuntos)) P[id] = { BR: a.valores.BR, ...(uf ? { [uf]: a.valores[uf] } : a.valores) };

  const consultado = (iso: string) => `consultado em ${dataBr(iso)}`;
  return {
    anos, final: Y1, prel: vital.anoPreliminar, ids, v, pns: P,
    datas: {
      sim: consultado(vital.baixadoEm), sinasc: consultado(vital.baixadoEm), cnes: consultado(rede.baixadoEm), ans: consultado(planos.baixadoEm),
      pns: consultado(pns.baixadoEm), pop: consultado(vital.baixadoEm),
    },
    refs: { cnes: rede.periodo, ans: planos.periodo, pns: pns.periodo, pop: popUF.estimativa.periodo },
    fontes: [vital.fontes.sim, vital.fontes.sinasc, rede.fontes.cnes, planos.fontes.ans, { nome: 'IBGE', publicacao: 'Pesquisa Nacional de Saúde 2019', url: 'https://sidra.ibge.gov.br/pesquisa/pns' }, vital.fontes.pop],
    calculos: { ...vital.calculos, rede: rede.calculo, planos: planos.calculo },
  };
}
