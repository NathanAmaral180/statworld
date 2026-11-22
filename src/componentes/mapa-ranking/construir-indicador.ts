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
  valorPais?: number | null; // valor do país inteiro (para comparar)
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
  aviso?: string; // nota sobre a medida (acima do mapa e na ficha)
  // Ficha com a composição (parte da medida × o resto, que soma 100%) e a comparação com o país.
  composicao?: { rotuloParte: string; rotuloResto: string };
  comparaPais?: boolean;
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
        const detalhes: [string, string][] = [];
        const pct = (x: number | null) => formatar(x, { formato: 'percentual', casas: m.casas }, ctx);
        if (m.composicao && v !== null) {
          detalhes.push([m.composicao.rotuloResto, pct(100 - (v as number))], [m.composicao.rotuloParte, pct(v as number)]);
        }
        if (m.comparaPais && ind.valorPais != null) {
          detalhes.push([t.mediaDoPais, formatar(ind.valorPais, fmt, ctx)]);
          if (v !== null) {
            const d = Math.round(((v as number) - ind.valorPais) * 10 ** m.casas) / 10 ** m.casas;
            const num = formatar(d, { formato: 'numero', casas: m.casas, sinal: true }, ctx);
            detalhes.push([t.diferencaMedia, preencher(Math.abs(d) === 1 ? t.ponto : t.pontos, { v: num })]);
          }
        }
        return [u.sigla, { topo: `${u.regiao} · ${pos}`, nome: u.nome, ...partes, apagado: v === null, detalhes: detalhes.length ? detalhes : undefined, aviso: m.aviso, nota }];
      })
    ),
    aviso: m.aviso,
    fonte: htmlFontes(ind.fontes, ctx, ind.calculo ? `${t.comoCalculamos}: ${ind.calculo}` : undefined),
  };
}
