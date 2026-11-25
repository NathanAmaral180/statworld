// Configuração das abas de Economia feitas com o molde PaginaEconomia (mapa + ranking por estado)
// e as visões de cada ano (seletor de ano / "ver a evolução").
// Usado pela página (src/componentes/PaginaEconomia.astro) e pelos arquivos de cada ano
// (src/pages/dados/[pais]/economia/[aba]/[ano].json.ts), para os dois mostrarem exatamente a mesma coisa.
import economiaEstados from '../config/temas/economia-estados.json';
import impostosEstados from '../config/temas/impostos-estados.json';
import trabalhoEstados from '../config/temas/trabalho-estados.json';
import precosEstados from '../config/temas/precos-estados.json';
import comercioEstados from '../config/temas/comercio-estados.json';
import dinheiroBrasil from '../config/temas/dinheiro-brasil.json';
import contasBrasil from '../config/temas/contas-publicas-brasil.json';
import { construirVisaoIndicador, type Medida } from '../componentes/mapa-ranking/construir-indicador';
import { preencher, formatar, type Visao } from '../componentes/mapa-ranking/visao';
import { carregarDados } from './dados';
import { contextoDoPais } from './contexto';

export const CONFIGS: Record<string, any> = { 'visao-geral': economiaEstados, impostos: impostosEstados, 'trabalho-renda': trabalhoEstados, precos: precosEstados, 'comercio-exterior': comercioEstados, 'dinheiro-juros': dinheiroBrasil, 'contas-publicas': contasBrasil };

// Configuração da aba, com as trocas do país (pais.abas.<aba>).
export function temaDaAba(pais: any, aba: string) {
  const tema = CONFIGS[aba] ? { ...CONFIGS[aba], ...(pais.abas?.[aba] ?? {}) } : undefined;
  if (!tema) throw new Error(`Aba sem configuração: ${aba}`);
  return tema;
}

// Medidas da aba: escritas na própria aba ou escolhidas pelo id entre as da Visão geral,
// com os cortes de cor do país quando ele tem os seus (moeda e escala mudam).
export function medidasDaAba(pais: any, tema: any): Medida[] {
  const todas = economiaEstados.medidas as Medida[];
  const cortesPais = pais.cortes?.['economia-estados'] ?? {};
  return (tema.medidas ?? [])
    .map((m: any) => (typeof m === 'string' ? todas.find((x) => x.id === m) ?? (() => { throw new Error(`Medida desconhecida: ${m}`); })() : m))
    .map((m: Medida) => ({ ...m, cortes: cortesPais[m.id] ?? m.cortes }));
}

// ---------- Anos ----------
// Arquivo com todos os anos (ex.: dados/economia/brasil-estados-anos.json), declarado no país em arquivos.economia.anos.
// Só abas que usam a pasta "economia" e têm medidas no mapa ganham o seletor de ano.
export function temAnos(pais: any, aba: string) {
  const tema = temaDaAba(pais, aba);
  return (tema.dados ?? 'economia') === 'economia' && !!tema.medidas?.length && !!pais.arquivos?.economia?.anos;
}

export function serieDeAnos(pais: any) {
  return carregarDados<any>('economia', pais.arquivos.economia.anos);
}

// Anos em que cada medida tem pelo menos um estado com dado (ex.: crescimento só a partir do 2º ano da série).
export function anosPorMedida(pais: any, aba: string): { lista: string[]; porMedida: Record<string, string[]> } {
  const serie = serieDeAnos(pais);
  const medidas = medidasDaAba(pais, temaDaAba(pais, aba));
  const porMedida = Object.fromEntries(medidas.map((m) => [m.id, serie.anos.filter((a: string) => Object.values(serie.porAno[a][m.id]?.valores ?? {}).some((v) => v != null))]));
  return { lista: serie.anos, porMedida };
}

// Visões de um ano para as medidas da aba. Em anos antigos, a ficha ganha a comparação com o ano mais recente e,
// nas medidas em dinheiro corrigidas pela inflação (o arquivo traz "valoresDaEpoca"), o valor da época e o aviso da correção.
export function visoesDoAno(pais: any, aba: string, ano: string): Record<string, Visao> {
  const { ctx, unidades } = contextoDoPais(pais, 'estado');
  const t = ctx.textos;
  const serie = serieDeAnos(pais);
  const ultimo = serie.anos.at(-1);
  const ind = serie.porAno[ano];
  const indUltimo = serie.porAno[ultimo];
  if (!ind) throw new Error(`Ano sem dados: ${ano}`);
  const medidas = medidasDaAba(pais, temaDaAba(pais, aba)).filter((m) => ind[m.id]);
  return Object.fromEntries(medidas.map((m) => {
    const v = construirVisaoIndicador(m.id, unidades, ind[m.id], m, ctx, ind);
    if (ano !== ultimo && indUltimo?.[m.id]) {
      const vu = construirVisaoIndicador(m.id, unidades, indUltimo[m.id], m, ctx, indUltimo);
      const linhaUltimo = Object.fromEntries(vu.linhas.map((l) => [l.uf, l]));
      const daEpoca = (ind[m.id] as any).valoresDaEpoca as Record<string, number | null> | undefined;
      const anoReais = (ind[m.id] as any).anoDosReais;
      for (const [uf, f] of Object.entries(v.fichas) as [string, any][]) {
        const extras: [string, string][] = [];
        if (daEpoca && daEpoca[uf] != null) extras.push([t.naEpoca, formatar(daEpoca[uf], { formato: m.formato, casas: m.casas, compacto: m.compacto }, ctx)]);
        const l = linhaUltimo[uf];
        if (l) extras.push([preencher(t.emAno, { ano: ultimo }), l.pos ? `${l.pos}º · ${l.texto}` : l.texto]);
        f.detalhes = [...(f.detalhes ?? []), ...extras];
        if (daEpoca && anoReais && !f.apagado) {
          const aviso = preencher(t.corrigidoIPCA, { ano: anoReais });
          f.aviso = f.aviso ? `${f.aviso} ${aviso}` : aviso;
        }
      }
    }
    return [m.id, v];
  }));
}
