// Regras do molde "mapa + ranking + ficha".
// Usado no servidor (primeira versão da página) e no navegador (quando a pessoa
// troca a medida ou passa o mouse). Nada aqui é exclusivo de um país:
// idioma, moeda e textos chegam pela configuração.

export type Valor = number | null; // null = sem dado (nunca zero)

export interface Fonte {
  nome: string;
  publicacao: string;
  url?: string;
  dataDivulgacao?: string;
}

export interface Indicador {
  nome: string;
  unidade: '%' | 'moeda' | string;
  periodo: string;
  fontes: Fonte[];
  calculo?: string;
  valores: Record<string, Valor>;
}

export interface Medida {
  id: string;
  rotulo: string;
  titulo: string;
  formato: 'percentual' | 'moeda' | 'numero';
  casas: number;
  sinal: boolean;
  cortes: number[];
}

export interface Unidade {
  codigo: string;
  sigla: string;
  nome: string;
  regiao: string;
}

export interface Contexto {
  idioma: string;
  moeda: string; // código, ex.: BRL
  textos: Record<string, string>;
  nivelSingular: string;
  nivelPlural: string;
}

export interface Linha {
  unidade: Unidade;
  valor: Valor;
  posicao: number | null; // null quando sem dado
}

// ---------- utilidades ----------

export function preencher(modelo: string, vars: Record<string, string | number>): string {
  return modelo.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function escapar(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// Em qual das 6 cores o valor cai. -1 = sem dado.
export function classe(valor: Valor, cortes: number[]): number {
  if (valor === null) return -1;
  const i = cortes.findIndex((c) => valor <= c);
  return i === -1 ? cortes.length : i;
}

// ---------- números ----------

function formatador(m: Medida, ctx: Contexto, compacto = false, sinal = m.sinal): Intl.NumberFormat {
  const base: Intl.NumberFormatOptions = {
    minimumFractionDigits: compacto ? 0 : m.casas,
    maximumFractionDigits: compacto ? 1 : m.casas,
    signDisplay: sinal ? 'exceptZero' : 'auto',
  };
  if (compacto) base.notation = 'compact';
  if (m.formato === 'percentual') return new Intl.NumberFormat(ctx.idioma, { ...base, style: 'percent' });
  if (m.formato === 'moeda') return new Intl.NumberFormat(ctx.idioma, { ...base, style: 'currency', currency: ctx.moeda });
  return new Intl.NumberFormat(ctx.idioma, base);
}
const paraFormato = (m: Medida, v: number) => (m.formato === 'percentual' ? v / 100 : v);

export function formatar(v: Valor, m: Medida, ctx: Contexto): string {
  if (v === null) return ctx.textos.semDado;
  return formatador(m, ctx).format(paraFormato(m, v));
}

// Separa o número do símbolo (% ou R$) para mostrar o símbolo menor na ficha.
export function formatarEmPartes(v: Valor, m: Medida, ctx: Contexto) {
  if (v === null) return { antes: '', numero: ctx.textos.semDado, depois: '' };
  const partes = formatador(m, ctx).formatToParts(paraFormato(m, v));
  const ehSimbolo = (t: string) => t === 'percentSign' || t === 'currency';
  const iNum = partes.findIndex((p) => !ehSimbolo(p.type) && p.type !== 'literal');
  const iFim = partes.length - 1 - [...partes].reverse().findIndex((p) => !ehSimbolo(p.type) && p.type !== 'literal');
  const txt = (ps: Intl.NumberFormatPart[]) => ps.map((p) => p.value).join('').trim();
  return { antes: txt(partes.slice(0, iNum)), numero: txt(partes.slice(iNum, iFim + 1)), depois: txt(partes.slice(iFim + 1)) };
}

// Textos da legenda gerados a partir dos cortes ("até 1,5%", "1,5–2,5%", "12% ou mais").
export function rotulosLegenda(m: Medida, ctx: Contexto): string[] {
  const f = formatador(m, ctx, true, false);
  const p = (v: number) => {
    const partes = f.formatToParts(paraFormato(m, v));
    const simb = partes.filter((x) => x.type === 'percentSign' || x.type === 'currency').map((x) => x.value).join('');
    const num = partes.filter((x) => x.type !== 'percentSign' && x.type !== 'currency').map((x) => x.value).join('').trim();
    const antes = partes.findIndex((x) => x.type === 'currency') === 0;
    return { cheio: f.format(paraFormato(m, v)), num, simb, antes };
  };
  const c = m.cortes;
  const t = ctx.textos;
  const rotulos = [preencher(t.ate, { v: p(c[0]).cheio })];
  for (let i = 1; i < c.length; i++) {
    const a = p(c[i - 1]);
    const b = p(c[i]);
    // símbolo só uma vez: "1,5–2,5%" ou "R$ 25 mil–30 mil"
    rotulos.push(
      a.antes
        ? preencher(t.entre, { a: a.cheio, b: b.num })
        : preencher(t.entre, { a: a.num, b: b.cheio })
    );
  }
  rotulos.push(preencher(t.ouMais, { v: p(c[c.length - 1]).cheio }));
  return rotulos;
}

// ---------- ranking ----------

export function montarRanking(unidades: Unidade[], ind: Indicador, idioma: string): Linha[] {
  const comDado = unidades
    .filter((u) => ind.valores[u.sigla] != null)
    .sort((a, b) => (ind.valores[b.sigla] as number) - (ind.valores[a.sigla] as number));
  const semDado = unidades
    .filter((u) => ind.valores[u.sigla] == null)
    .sort((a, b) => a.nome.localeCompare(b.nome, idioma));
  return [
    ...comDado.map((u, i) => ({ unidade: u, valor: ind.valores[u.sigla] as number, posicao: i + 1 })),
    ...semDado.map((u) => ({ unidade: u, valor: null, posicao: null })),
  ];
}

// ---------- pedaços de HTML (iguais no servidor e no navegador) ----------

export function htmlRanking(linhas: Linha[], m: Medida, ctx: Contexto, ativo: string | null): string {
  const vals = linhas.map((l) => l.valor).filter((v): v is number => v !== null);
  const min = Math.min(0, ...vals);
  const max = Math.max(0, ...vals);
  const faixa = max - min || 1;
  const zero = ((0 - min) / faixa) * 100;
  return linhas
    .map((l) => {
      const s = l.unidade.sigla;
      let barra = '';
      if (l.valor !== null) {
        const pos = ((l.valor - min) / faixa) * 100;
        const esq = Math.min(zero, pos);
        const larg = Math.max(Math.abs(pos - zero), 0.6);
        barra = `<span class="barra" style="left:${esq.toFixed(2)}%;width:${larg.toFixed(2)}%"></span>`;
      }
      return `<li><button type="button" class="linha${l.valor === null ? ' sem' : ''}${s === ativo ? ' ativa' : ''}" data-uf="${s}" aria-pressed="${s === ativo}">
<span class="pos">${l.posicao ?? '—'}</span><span class="nome">${escapar(l.unidade.nome)}</span><span class="trilho">${barra}</span><span class="valor">${escapar(formatar(l.valor, m, ctx))}</span></button></li>`;
    })
    .join('');
}

export function htmlFicha(linha: Linha, total: number, comDado: number, m: Medida, tituloMedida: string, ind: Indicador, ctx: Contexto): string {
  const t = ctx.textos;
  const pos =
    linha.posicao === null
      ? ctx.textos.semDado
      : preencher(comDado < total ? t.posicaoComFalta : t.posicao, { n: linha.posicao, total: comDado });
  const partes = formatarEmPartes(linha.valor, m, ctx);
  const fontes = ind.fontes.map((f) => `${f.nome}, ${f.publicacao}`).join('; ');
  return `<p class="ficha-topo">${escapar(linha.unidade.regiao)} · ${escapar(pos)}</p>
<div class="ficha-linha"><h2 class="ficha-nome">${escapar(linha.unidade.nome)}</h2>
<p class="ficha-valor${linha.valor === null ? ' sem' : ''}">${partes.antes ? `<small>${escapar(partes.antes)}</small>` : ''}<strong>${escapar(partes.numero)}</strong>${partes.depois ? `<small>${escapar(partes.depois)}</small>` : ''}</p></div>
<p class="ficha-fonte">${escapar(tituloMedida)} · ${escapar(fontes)}</p>`;
}

export function htmlFonte(ind: Indicador, ctx: Contexto): string {
  const t = ctx.textos;
  const data = (d?: string) =>
    d ? ', ' + preencher(t.divulgadaEm, { data: new Date(d + 'T12:00:00').toLocaleDateString(ctx.idioma, { day: 'numeric', month: 'long', year: 'numeric' }) }) : '';
  const fontes = ind.fontes
    .map((f) => {
      const nome = `${escapar(f.nome)}, ${escapar(f.publicacao)}`;
      return (f.url ? `<a href="${escapar(f.url)}" rel="noopener" target="_blank">${nome}</a>` : nome) + escapar(data(f.dataDivulgacao));
    })
    .join('; ');
  const calculo = ind.calculo ? `<br>${escapar(t.comoCalculamos)}: ${escapar(ind.calculo)}` : '';
  return `${escapar(t.fonte)}: ${fontes}.${calculo}`;
}

export function htmlLegenda(m: Medida, ctx: Contexto, qtdSemDado: number): string {
  const rot = rotulosLegenda(m, ctx);
  const itens = rot.map((r, i) => `<li><span class="amostra c${i}"></span>${escapar(r)}</li>`).join('');
  const sem = qtdSemDado
    ? `<li class="leg-sem"><span class="amostra hachura"></span>${escapar(preencher(ctx.textos.legendaSemDado, { n: qtdSemDado, nivel: qtdSemDado === 1 ? ctx.nivelSingular : ctx.nivelPlural }))}</li>`
    : '';
  return itens + sem;
}
