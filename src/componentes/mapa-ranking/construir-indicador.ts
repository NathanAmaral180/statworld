// Monta a visão de um indicador numérico simples (ex.: PIB, crescimento):
// cor pela faixa de valor (6 tons), ranking do maior para o menor.
import {
  barras, classeSequencial, formatar, formatarEmPartes, htmlFontes, preencher, rotulosCortes,
  type Contexto, type Fonte, type Unidade, type Visao, type Valor, type Formato,
} from './visao';

export interface Indicador {
  nome: string;
  unidade: string;
  periodo: string;
  fontes: Fonte[];
  calculo?: string;
  valores: Record<string, Valor>;
}

export interface Medida {
  id: string;
  rotulo: string;
  titulo: string;
  formato: Formato;
  casas: number;
  sinal: boolean;
  cortes: number[];
}

export function construirVisaoIndicador(id: string, unidades: Unidade[], ind: Indicador, m: Medida, ctx: Contexto): Visao {
  const t = ctx.textos;
  const fmt = { formato: m.formato, casas: m.casas, sinal: m.sinal };
  const titulo = preencher(m.titulo, { periodo: ind.periodo });

  const comDado = unidades
    .filter((u) => ind.valores[u.sigla] != null)
    .sort((a, b) => (ind.valores[b.sigla] as number) - (ind.valores[a.sigla] as number));
  const semDado = unidades.filter((u) => ind.valores[u.sigla] == null).sort((a, b) => a.nome.localeCompare(b.nome, ctx.idioma));
  const ordem = [...comDado, ...semDado];
  const bs = barras(ordem.map((u) => ind.valores[u.sigla]));
  const total = unidades.length;
  const n = comDado.length;
  const nota = `${titulo} · ${ind.fontes.map((f) => `${f.nome}, ${f.publicacao}`).join('; ')}`;

  const legenda = rotulosCortes(m.cortes, fmt, ctx).map((rotulo, i) => ({ classe: 'c' + i, rotulo }));
  if (semDado.length) {
    legenda.push({ classe: 'sem', rotulo: preencher(t.legendaSemDado, { n: semDado.length, nivel: semDado.length === 1 ? ctx.nivelSingular : ctx.nivelPlural }) });
  }

  return {
    id,
    titulo,
    classes: Object.fromEntries(unidades.map((u) => [u.sigla, classeSequencial(ind.valores[u.sigla], m.cortes)])),
    legenda,
    linhas: ordem.map((u, i) => ({
      uf: u.sigla,
      nome: u.nome,
      pos: i < n ? i + 1 : null,
      texto: formatar(ind.valores[u.sigla], fmt, ctx),
      barra: bs[i],
      tipo: i < n ? undefined : 'sem',
    })),
    fichas: Object.fromEntries(
      ordem.map((u, i) => {
        const v = ind.valores[u.sigla];
        const partes = formatarEmPartes(v, fmt, ctx);
        const pos = i < n ? preencher(n < total ? t.posicaoComFalta : t.posicao, { n: i + 1, total: n }) : t.semDado;
        return [u.sigla, { topo: `${u.regiao} · ${pos}`, nome: u.nome, ...partes, apagado: v === null, nota }];
      })
    ),
    fonte: htmlFontes(ind.fontes, ctx, ind.calculo ? `${t.comoCalculamos}: ${ind.calculo}` : undefined),
  };
}
