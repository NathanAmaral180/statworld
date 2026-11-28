// Monta, com os NOSSOS dados conferidos (dados/demografia/, dados/geo/), o objeto que o código das telas do design
// da rodada 6 espera (window.SW_DEMO_DATA e a configuração window.SW_DEMO). Assim as telas ficam fiéis ao design
// (o mesmo código) e todo número continua vindo dos scripts do projeto.
// Formato: o de design/rodada-6-demografia/codigo/ (chaves por lugar: "BR", siglas dos estados e códigos de município).
import { carregarDados } from './dados';
import { arquivosDemografia } from './demografia';
import cfgDesign from '../config/temas/demografia-design.json';

const r1 = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);
const r2 = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);
const junta17 = (a: number[]) => [...a.slice(0, 16), a.slice(16).reduce((s, v) => s + v, 0)]; // 21 faixas → 17 (80+)

export function dadosDesign(pais: any, uf?: string) {
  const { pop, censo, series } = arquivosDemografia(pais);
  const P = pop.indicadores;
  const lugaresUF = Object.keys(P.populacao.valores); // BR + 27
  // Municípios do estado (só nas páginas do estado)
  let mun: string[] = [], nomes: Record<string, string> = {}, popMun: any = null, censoMun: any = null, vital: any = null, pirMun: any = null;
  if (uf) {
    const arqs = pais.estados.comPagina[uf].arquivos;
    const geo = carregarDados<any>('geo', arqs.geo);
    mun = geo.unidades.map((u: any) => u.codigo);
    nomes = Object.fromEntries(geo.unidades.map((u: any) => [u.codigo, `${u.nome} - ${uf}`]));
    popMun = carregarDados<any>('demografia', arqs.demografia).indicadores;
    censoMun = carregarDados<any>('demografia', arqs.demografiaCenso);
    vital = carregarDados<any>('demografia', arqs.demografiaVital);
    pirMun = arqs.demografiaPiramides ? carregarDados<any>('demografia', arqs.demografiaPiramides).valores : null;
  }
  const todos = [...lugaresUF, ...mun];
  const ind = (l: string) => (mun.includes(l) ? popMun : P);
  const cen = (l: string) => (mun.includes(l) ? censoMun?.lugares[l] : censo?.lugares[l]);
  const porLugar = (f: (l: string) => any) => Object.fromEntries(todos.map((l) => [l, f(l)]));
  const v = (id: string) => porLugar((l) => ind(l)[id]?.valores[l] ?? null);
  // Pirâmide 2022 (17 faixas): dos estados e do país, do arquivo de população; dos municípios não há pirâmide completa.
  const pyr: Record<string, any> = Object.fromEntries(lugaresUF.map((l) => { const p = pop.piramides.valores[l]; return [l, p ? [junta17(p.homens), junta17(p.mulheres)] : null]; }));
  for (const c of mun) pyr[c] = pirMun?.[c] ?? null; // pirâmide de cada município (scripts/piramides-municipios/)

  const dados: any = {
    names: nomes,
    pop: v('populacao'),
    pop10: porLugar((l) => { const a = ind(l).populacao.valores[l], d = ind(l)['variacao-2010'].valores[l]; return a != null && d != null ? a - d : null; }),
    tx: v('crescimento-ano'),
    area: v('area'),
    dens: v('densidade'),
    est: v('estimativa'),
    estYear: P.estimativa.periodo,
    raca: porLugar((l) => { const c = cen(l); return c ? [c.raca.branca, c.raca.preta, c.raca.amarela, c.raca.parda, c.raca.indigena] : null; }),
    ind: porLugar((l) => { const c = cen(l); return c ? [c.indigenas.total, c.indigenas.total != null && c.situacao.total ? r2((c.indigenas.total / c.situacao.total) * 100) : null, c.indigenas.emTerras] : null; }),
    qui: porLugar((l) => { const c = cen(l); return c ? [c.quilombolas.total, c.quilombolas.total != null && c.situacao.total ? r2((c.quilombolas.total / c.situacao.total) * 100) : null, c.quilombolas.emTerritorios] : null; }),
    dom: porLugar((l) => { const c = cen(l); return c ? [c.domicilios.ocupados, c.domicilios.mediaMoradores] : null; }),
    sit: porLugar((l) => { const c = cen(l); return c ? [c.situacao.urbana, c.situacao.rural] : null; }),
    idmed: v('idade-mediana'),
    // Índice de envelhecimento como o IBGE: pessoas de 65 anos ou mais para cada 100 de 0 a 14.
    envel: porLugar((l) => {
      if (pyr[l]) { const t = pyr[l][0].map((h: number, i: number) => h + pyr[l][1][i]); const k = t[0] + t[1] + t[2], o = t[13] + t[14] + t[15] + t[16]; return k ? r1((o / k) * 100) : null; }
      const a = ind(l)['idade-idosos65']?.valores[l], c = ind(l)['idade-criancas']?.valores[l]; return a != null && c ? r1((a / c) * 100) : null;
    }),
    pyr,
    nascM: vital ? Object.fromEntries(mun.map((c) => [c, vital.nascimentos[c] ?? null])) : {},
    obitM: vital ? Object.fromEntries(mun.map((c) => [c, vital.obitos[c] ?? null])) : {},
    migPeriod: series?.migracao.periodo ?? '2022',
  };
  if (series) {
    const S = series.piramides;
    dados.hist = Object.fromEntries(S.anos.filter((a: number) => a !== 2022).map((a: number) => [String(a), Object.fromEntries(lugaresUF.map((l) => { const p = S.valores[l]?.[a]; return [l, p ? [p.h, p.m] : null]; }))]));
    const PJ = series.projecao.valores;
    const ts = (campo: string) => Object.fromEntries(lugaresUF.map((l) => [l, Object.fromEntries(Object.entries(PJ[l] ?? {}).map(([a, x]: [string, any]) => [a, x[campo] ?? null]))]));
    dados.ts = { tft: ts('filhosPorMulher'), envelP: ts('envelhecimento65'), idmedP: ts('idadeMediana'), nascP: ts('nascimentos'), obitP: ts('obitos'), e0: ts('e0'), e0m: ts('e0Homens'), e0f: ts('e0Mulheres') };
    dados.rc = { nasc: series.registroCivil.nascimentos, obit: series.registroCivil.obitos };
    dados.mig = Object.fromEntries(Object.entries(series.migracao.valores).filter(([l]) => l !== 'BR').map(([l, m]: [string, any]) => [l, { T: m.total, ...m.porOrigem, [l]: m.mesmoEstado, EXT: m.exterior }]));
  }
  return dados;
}

// Configuração das telas (window.SW_DEMO): a do design, com os endereços do site, as nossas fontes e datas.
export function configDesign(pais: any, dados: any, uf?: string) {
  const { pop, series } = arquivosDemografia(pais);
  const c: any = structuredClone(cfgDesign);
  c.noSite = true;
  c.consult = `consulta em ${new Date(pop.baixadoEm + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/[.]/g, '').replace(/ de /g, ' ')}`;
  c.SRC.est.s = `IBGE, Estimativas da população ${dados.estYear}`;
  c.SRC.live.s = `StatWorld, sobre IBGE Estimativas ${dados.estYear} e Registro Civil ${series?.registroCivil.ultimoAno ?? ''}`.trim();
  c.SRC.rc.s = `IBGE, Estatísticas do Registro Civil ${series?.registroCivil.ultimoAno ?? ''}`.trim();
  if (uf && pais.estados.comPagina[uf]?.destaque) {
    const d = pais.estados.comPagina[uf].destaque;
    for (const k of Object.keys(c.sub)) c.sub[k].flag = { light: d.claro, dark: d.escuro, name: d.origem };
  }
  if (series) c.YEARS = [1980, 1991, 2000, 2010, 2022, ...series.piramides.anos.filter((a: number) => a > 2022)];
  return c;
}
