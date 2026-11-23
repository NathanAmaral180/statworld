// Monta a visão de um indicador numérico simples (ex.: PIB, crescimento):
// cor pela faixa de valor (6 tons), ranking do maior para o menor.
import {
  barras, classeSequencial, dataCurta, quandoCurto, formatar, formatarEmPartes, htmlFontes, preencher, rotulosCortes,
  type Contexto, type Fonte, type Unidade, type Visao, type Valor, type Formato,
} from './visao';

export interface Indicador {
  nome: string;
  unidade: string;
  periodo: string;
  fontes: Fonte[];
  calculo?: string;
  valorPais?: number | null; // valor do país inteiro (para comparar)
  nomes?: Record<string, string>; // nome a mostrar no lugar do estado (ex.: a capital, quando a medida é da capital)
  frequencia?: string; // anual, mensal... (vira selo na ficha)
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
  aviso?: string; // nota sobre a medida (acima do mapa)
  avisoTitulo?: string; // começo da nota, em negrito; também é a frase curta repetida na ficha
  sufixoFicha?: string; // texto depois do número na ficha (ex.: " do PIB" → "16,4% do PIB")
  rotuloRanking?: string; // título curto da coluna do ranking (ex.: "% do PIB")
  // Ficha com a composição (parte da medida × o resto, que soma 100%) e a comparação com o país.
  composicao?: { rotuloParte: string; rotuloResto: string };
  comparaPais?: boolean;
  nivelPlural?: string; // troca "estados" na posição da ficha (ex.: "capitais")
  nivelFeminino?: boolean; // concordância: "todas as 27 capitais"
  subtituloFicha?: string; // linha sob o nome na ficha (ex.: "Desemprego, {periodo}")
  // Outros números do mesmo arquivo de dados mostrados na ficha (ex.: renda média ao lado do desemprego).
  extras?: { indicador: string; rotulo: string; formato: Formato; casas: number; sufixo?: string; sinal?: boolean; mostrarFonte?: boolean }[];
}

export function construirVisaoIndicador(id: string, unidades: Unidade[], ind: Indicador, m: Medida, ctx: Contexto, outros: Record<string, Indicador> = {}): Visao {
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
  const f0 = ind.fontes[0] as Fonte & { dataDivulgacao?: string };
  // Com frequência declarada, a ficha mostra o carimbo "selo + fonte · data"; sem ela, o texto de sempre.
  const nota = ind.frequencia
    ? `${f0.nome}, ${f0.publicacao}${quandoCurto(f0 as any, ctx)}`
    : `${titulo} · ${ind.fontes.map((f) => `${f.nome}, ${f.publicacao}`).join('; ')}`;

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
      nome: ind.nomes?.[u.sigla] ?? u.nome,
      pos: i < n ? i + 1 : null,
      texto: formatar(ind.valores[u.sigla], fmt, ctx),
      barra: bs[i],
      tipo: i < n ? undefined : 'sem',
    })),
    fichas: Object.fromEntries(
      ordem.map((u, i) => {
        const v = ind.valores[u.sigla];
        const partes = formatarEmPartes(v, fmt, ctx);
        const pos = i < n ? preencher(n < total ? t.posicaoComFalta : t.posicao, { n: i + 1, total: n, nivel: m.nivelPlural ?? ctx.nivelPlural }) : t.semDado;
        const detalhes: [string, string][] = [];
        const carimbosExtras: { selo?: string; texto: string }[] = [];
        for (const x of m.extras ?? []) {
          const outro = outros[x.indicador];
          if (!outro) continue;
          const vx = outro.valores[u.sigla];
          detalhes.push([preencher(x.rotulo, { periodo: outro.periodo }), formatar(vx, { formato: x.formato, casas: x.casas, sinal: x.sinal }, ctx) + (vx != null && x.sufixo ? x.sufixo : '')]);
          if (x.mostrarFonte) {
            const fx = outro.fontes[0] as Fonte & { dataDivulgacao?: string };
            carimbosExtras.push({ selo: (outro as any).frequencia, texto: `${fx.nome}, ${fx.publicacao}${quandoCurto(fx as any, ctx)}` });
          }
        }
        const pct = (x: number | null) => formatar(x, { formato: 'percentual', casas: m.casas }, ctx);
        const composicao = m.composicao && v !== null
          ? [
              { rotulo: m.composicao.rotuloResto, texto: pct(100 - (v as number)), largura: 100 - (v as number) },
              { rotulo: m.composicao.rotuloParte, texto: pct(v as number), largura: v as number, destaque: true },
            ]
          : undefined;
        if (m.comparaPais && ind.valorPais != null) {
          detalhes.push([t.mediaDoPais, formatar(ind.valorPais, fmt, ctx)]);
          if (v !== null) {
            const d = Math.round(((v as number) - ind.valorPais) * 10 ** m.casas) / 10 ** m.casas;
            const num = formatar(d, { formato: 'numero', casas: m.casas, sinal: true }, ctx);
            detalhes.push([t.diferencaMedia, preencher(Math.abs(d) === 1 ? t.ponto : t.pontos, { v: num })]);
          }
        }
        if (m.sufixoFicha && v !== null) partes.depois += m.sufixoFicha;
        return [u.sigla, { topo: `${u.regiao} · ${pos}`, nome: ind.nomes?.[u.sigla] ?? u.nome, ...partes, subtitulo: m.subtituloFicha ? preencher(m.subtituloFicha, { periodo: ind.periodo }) : undefined, apagado: v === null, composicao, detalhes: detalhes.length ? detalhes : undefined, aviso: m.avisoTitulo ?? m.aviso, selo: ind.frequencia, nota, carimbosExtras: carimbosExtras.length ? carimbosExtras : undefined }];
      })
    ),
    aviso: m.aviso,
    avisoTitulo: m.avisoTitulo,
    cabecalhoRanking: m.rotuloRanking,
    nivelPlural: m.nivelPlural,
    nivelFeminino: m.nivelFeminino,
    fonte: htmlFontes(ind.fontes, ctx, ind.calculo ? `${t.comoCalculamos}: ${ind.calculo}` : undefined),
  };
}
