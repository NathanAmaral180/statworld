// "Visão" = tudo que o molde mapa + ranking + ficha precisa para desenhar uma medida:
// a cor de cada lugar, a legenda, as linhas do ranking e a ficha de cada lugar.
// As visões são montadas no servidor (construir-*.ts). O navegador só desenha.
// Nada aqui é exclusivo de um país: idioma, moeda e textos chegam pela configuração.

export type Valor = number | null; // null = sem dado (nunca zero)

export interface Fonte {
  nome: string;
  publicacao: string;
  url?: string;
  dataDivulgacao?: string;
  dataAtualizacao?: string;
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

export interface LinhaRanking {
  uf: string;
  nome: string;
  pos: number | null;
  texto: string;
  barra: [number, number] | null; // [esquerda %, largura %]
  marca?: string; // classe de cor de um marcador antes do nome (ex.: produto líder)
  tipo?: 'sem' | 'zero';
}

export interface Ficha {
  topo: string;
  nome: string;
  antes: string;
  numero: string;
  depois: string;
  apagado?: boolean; // sem dado / não produz
  subtitulo?: string;
  marca?: string;
  detalhes?: [string, string][];
  link?: { texto: string; url: string };
  nota: string;
}

export interface Visao {
  id: string;
  titulo: string; // título da coluna do ranking
  classes: Record<string, string>; // c0..c5 | cat-N | outro | zero | sem
  legenda: { classe: string; rotulo: string }[];
  legendaTitulo?: string;
  linhas: LinhaRanking[];
  fichas: Record<string, Ficha>;
  fonte: string; // HTML já escapado
}

// ---------- utilidades ----------

export function preencher(modelo: string, vars: Record<string, string | number>): string {
  return modelo.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function escapar(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// Em qual das 6 cores o valor cai.
export function classeSequencial(valor: Valor, cortes: number[]): string {
  if (valor === null) return 'sem';
  const i = cortes.findIndex((c) => valor <= c);
  return 'c' + (i === -1 ? cortes.length : i);
}

// Barras do ranking: começam no zero (valores negativos vão para a esquerda).
export function barras(valores: Valor[]): ([number, number] | null)[] {
  const vals = valores.filter((v): v is number => v !== null);
  const min = Math.min(0, ...vals);
  const max = Math.max(0, ...vals);
  const faixa = max - min || 1;
  const zero = ((0 - min) / faixa) * 100;
  return valores.map((v) => {
    if (v === null) return null;
    const pos = ((v - min) / faixa) * 100;
    return [+Math.min(zero, pos).toFixed(2), +Math.max(Math.abs(pos - zero), 0.6).toFixed(2)];
  });
}

// ---------- números ----------

export type Formato = 'percentual' | 'moeda' | 'numero';
export interface OpcoesNumero {
  formato: Formato;
  casas: number;
  minCasas?: number;
  sinal?: boolean;
  compacto?: boolean;
  sufixo?: string; // ex.: " t"
}

function formatador(o: OpcoesNumero, ctx: Contexto): Intl.NumberFormat {
  const base: Intl.NumberFormatOptions = {
    minimumFractionDigits: o.minCasas ?? o.casas,
    maximumFractionDigits: o.casas,
    signDisplay: o.sinal ? 'exceptZero' : 'auto',
  };
  if (o.compacto) base.notation = 'compact';
  if (o.formato === 'percentual') return new Intl.NumberFormat(ctx.idioma, { ...base, style: 'percent' });
  if (o.formato === 'moeda') return new Intl.NumberFormat(ctx.idioma, { ...base, style: 'currency', currency: ctx.moeda });
  return new Intl.NumberFormat(ctx.idioma, base);
}
const paraFormato = (o: OpcoesNumero, v: number) => (o.formato === 'percentual' ? v / 100 : v);

export function formatar(v: Valor, o: OpcoesNumero, ctx: Contexto): string {
  if (v === null) return ctx.textos.semDado;
  return formatador(o, ctx).format(paraFormato(o, v)) + (o.sufixo ?? '');
}

// Separa o número do símbolo (%, R$, bi) para mostrar o símbolo menor na ficha.
export function formatarEmPartes(v: Valor, o: OpcoesNumero, ctx: Contexto) {
  if (v === null) return { antes: '', numero: ctx.textos.semDado, depois: '' };
  const partes = formatador(o, ctx).formatToParts(paraFormato(o, v));
  const ehNumero = (t: string) => ['minusSign', 'plusSign', 'integer', 'group', 'decimal', 'fraction'].includes(t);
  const iNum = partes.findIndex((p) => ehNumero(p.type));
  const iFim = partes.length - 1 - [...partes].reverse().findIndex((p) => ehNumero(p.type));
  const txt = (ps: Intl.NumberFormatPart[]) => ps.map((p) => p.value).join('').trim();
  return {
    antes: txt(partes.slice(0, iNum)),
    numero: txt(partes.slice(iNum, iFim + 1)),
    depois: (txt(partes.slice(iFim + 1)) + (o.sufixo ?? '')).trim(),
  };
}

// Textos da legenda a partir dos cortes ("até 1,5%", "1,5–2,5%", "12% ou mais").
export function rotulosCortes(cortes: number[], o: OpcoesNumero, ctx: Contexto): string[] {
  const fm = formatador({ ...o, compacto: true, sinal: false, casas: 1, minCasas: 0, sufixo: undefined }, ctx);
  const p = (v: number) => {
    const partes = fm.formatToParts(paraFormato(o, v));
    const ehSimb = (t: string) => t === 'percentSign' || t === 'currency';
    return {
      cheio: fm.format(paraFormato(o, v)),
      num: partes.filter((x) => !ehSimb(x.type)).map((x) => x.value).join('').trim(),
      antes: partes.findIndex((x) => x.type === 'currency') === 0,
    };
  };
  const t = ctx.textos;
  const r = [preencher(t.ate, { v: p(cortes[0]).cheio })];
  for (let i = 1; i < cortes.length; i++) {
    const a = p(cortes[i - 1]);
    const b = p(cortes[i]);
    r.push(a.antes ? preencher(t.entre, { a: a.cheio, b: b.num }) : preencher(t.entre, { a: a.num, b: b.cheio }));
  }
  r.push(preencher(t.ouMais, { v: p(cortes[cortes.length - 1]).cheio }));
  return r;
}

export function htmlFontes(fontes: Fonte[], ctx: Contexto, extra?: string): string {
  const t = ctx.textos;
  const data = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(ctx.idioma, { day: 'numeric', month: 'long', year: 'numeric' });
  const lista = fontes
    .map((f) => {
      const nome = `${escapar(f.nome)}, ${escapar(f.publicacao)}`;
      const quando = f.dataDivulgacao
        ? ', ' + preencher(t.divulgadaEm, { data: data(f.dataDivulgacao) })
        : f.dataAtualizacao
          ? ', ' + preencher(t.atualizadaEm, { data: data(f.dataAtualizacao) })
          : '';
      return (f.url ? `<a href="${escapar(f.url)}" rel="noopener" target="_blank">${nome}</a>` : nome) + escapar(quando);
    })
    .join('; ');
  return `${escapar(t.fonte)}: ${lista}.${extra ? `<br>${escapar(extra)}` : ''}`;
}

// ---------- HTML (igual no servidor e no navegador) ----------

export function htmlRanking(v: Visao, ativo: string | null): string {
  return v.linhas
    .map((l) => {
      const barra = l.barra ? `<span class="barra" style="left:${l.barra[0]}%;width:${l.barra[1]}%"></span>` : '';
      const marca = l.marca ? `<i class="marca" data-classe="${l.marca}"></i>` : '';
      return `<li><button type="button" class="linha${l.tipo ? ' ' + l.tipo : ''}${l.uf === ativo ? ' ativa' : ''}" data-uf="${l.uf}">
<span class="pos">${l.pos ?? '—'}</span><span class="nome">${marca}${escapar(l.nome)}</span><span class="trilho">${barra}</span><span class="valor">${escapar(l.texto)}</span></button></li>`;
    })
    .join('');
}

export function htmlFicha(f: Ficha): string {
  const valor = `${f.antes ? `<small>${escapar(f.antes)}</small>` : ''}<strong>${escapar(f.numero)}</strong>${f.depois ? `<small>${escapar(f.depois)}</small>` : ''}`;
  const sub = f.subtitulo
    ? `<p class="ficha-sub">${f.marca ? `<i class="marca" data-classe="${f.marca}"></i>` : ''}${escapar(f.subtitulo)}</p>`
    : '';
  const det = f.detalhes?.length
    ? `<dl class="ficha-detalhes">${f.detalhes.map(([a, b]) => `<div><dt>${escapar(a)}</dt><dd>${escapar(b)}</dd></div>`).join('')}</dl>`
    : '';
  const link = f.link ? `<a class="ficha-link" href="${escapar(f.link.url)}">${escapar(f.link.texto)} →</a>` : '';
  return `<p class="ficha-topo">${escapar(f.topo)}</p>
<div class="ficha-linha"><h2 class="ficha-nome">${escapar(f.nome)}</h2><p class="ficha-valor${f.apagado ? ' sem' : ''}">${valor}</p></div>
${sub}${det}${link}<p class="ficha-fonte">${escapar(f.nota)}</p>`;
}

export function htmlLegenda(v: Visao): string {
  const titulo = v.legendaTitulo ? `<li class="leg-titulo">${escapar(v.legendaTitulo)}</li>` : '';
  return titulo + v.legenda.map((l) => `<li class="leg-${l.classe}"><span class="amostra" data-classe="${l.classe}"></span>${escapar(l.rotulo)}</li>`).join('');
}
