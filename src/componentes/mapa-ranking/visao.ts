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
  icone?: string; // ícone antes do nome (ex.: produto líder)
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
  icone?: string;
  detalhes?: [string, string][];
  link?: { texto: string; url: string };
  aviso?: string; // nota importante sobre a medida (ex.: "não é arrecadação")
  // Composição em barra empilhada (ex.: valor adicionado × impostos), larguras em %.
  composicao?: { rotulo: string; texto: string; largura: number; destaque?: boolean }[];
  selo?: string; // selo de frequência (anual, mensal...) ao lado da fonte
  carimbosExtras?: { selo?: string; texto: string }[]; // fontes de outros números da ficha (ex.: Novo Caged)
  nota: string;
}

export interface Visao {
  id: string;
  titulo: string; // título da coluna do ranking
  classes: Record<string, string>; // c0..c5 | p-<produto> | zero | sem
  legenda: { classe: string; rotulo: string; icone?: string }[];
  legendaTitulo?: string;
  linhas: LinhaRanking[];
  fichas: Record<string, Ficha>;
  fonte: string; // HTML já escapado
  icones?: Record<string, string>; // lugar -> ícone desenhado no mapa
  svgs?: Record<string, string>; // ícone -> desenho (conteúdo do SVG 24x24)
  matiz?: string; // classe de cor (ex.: "p-soja") que tinge o degradê de 6 tons; sem matiz = azul padrão
  iconeTitulo?: string; // ícone ao lado do título da legenda
  nivelPlural?: string; // troca "estados" nos textos do ranking (ex.: "capitais")
  nivelFeminino?: boolean; // "todas as 27 capitais" em vez de "todos os 27 estados"
  aviso?: string; // nota sobre a medida, mostrada acima do mapa (ficha repete a versão curta)
  avisoTitulo?: string; // começo da nota, em negrito
  cabecalhoRanking?: string; // título curto da coluna do ranking (sem ele, usa "titulo")
}

// Nota sobre a medida (acima do mapa): ícone "i", começo em negrito e o resto.
export function htmlAviso(v: Visao): string {
  if (!v.aviso) return '';
  return `<em class="i" aria-hidden="true">i</em><span>${v.avisoTitulo ? `<b>${escapar(v.avisoTitulo)}</b> ` : ''}${escapar(v.aviso)}</span>`;
}

// Data da fonte para os carimbos curtos: " · 13 nov 2026" (divulgação) ou " · atualizada em 17 nov 2026".
export function quandoCurto(f: { dataDivulgacao?: string | null; dataAtualizacao?: string | null }, ctx: Contexto): string {
  if (f.dataDivulgacao) return ` · ${dataCurta(f.dataDivulgacao, ctx)}`;
  if (f.dataAtualizacao) return ` · ${preencher(ctx.textos.atualizadaEm, { data: dataCurta(f.dataAtualizacao, ctx) })}`;
  return '';
}

// Data curta (ex.: "13 nov 2026").
export function dataCurta(d: string, ctx: Contexto): string {
  return new Date(d + 'T12:00:00').toLocaleDateString(ctx.idioma, { day: 'numeric', month: 'short', year: 'numeric' }).replace(/[.]/g, '').replace(/ de /g, ' ');
}

// Ícone dentro do mapa: um círculo com o desenho no meio (posição dada pelo <g> de fora).
export function htmlChip(svgs: Record<string, string> | undefined, nome?: string): string {
  const corpo = nome && svgs?.[nome];
  return corpo ? `<circle class="chip" r="16"></circle><svg class="ic-mapa" x="-11" y="-11" width="22" height="22" viewBox="0 0 24 24">${corpo}</svg>` : '';
}

export function htmlIcone(svgs: Record<string, string> | undefined, nome?: string): string {
  const corpo = nome && svgs?.[nome];
  return corpo ? `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${corpo}</svg>` : '';
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
    const ehSimb = (t: string) => t === 'percentSign' || t === 'currency' || t === 'unit';
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
      const marca = htmlIcone(v.svgs, l.icone);
      return `<li><button type="button" class="linha${l.tipo ? ' ' + l.tipo : ''}${l.uf === ativo ? ' ativa' : ''}" data-uf="${l.uf}">
<span class="pos">${l.pos ?? '—'}</span><span class="nome">${marca}${escapar(l.nome)}</span><span class="trilho">${barra}</span><span class="valor">${escapar(l.texto)}</span></button></li>`;
    })
    .join('');
}

export function htmlFicha(f: Ficha, svgs?: Record<string, string>): string {
  const valor = `${f.antes ? `<small>${escapar(f.antes)}</small>` : ''}<strong>${escapar(f.numero)}</strong>${f.depois ? `<small>${escapar(f.depois)}</small>` : ''}`;
  const sub = f.subtitulo
    ? `<p class="ficha-sub">${htmlIcone(svgs, f.icone)}${escapar(f.subtitulo)}</p>`
    : '';
  const det = f.detalhes?.length
    ? `<dl class="ficha-detalhes">${f.detalhes.map(([a, b]) => `<div><dt>${escapar(a)}</dt><dd>${escapar(b)}</dd></div>`).join('')}</dl>`
    : '';
  const comp = f.composicao?.length
    ? `<div class="ficha-comp"><div class="ficha-pilha" role="img" aria-label="${escapar(f.composicao.map((c) => `${c.rotulo} ${c.texto}`).join(', '))}">${f.composicao.map((c) => `<i class="${c.destaque ? 'forte' : ''}" style="width:${c.largura.toFixed(2)}%"></i>`).join('')}</div><div class="ficha-pilha-rot">${f.composicao.map((c) => `<span class="${c.destaque ? 'forte' : ''}">${escapar(c.rotulo)} ${escapar(c.texto)}</span>`).join('')}</div></div>`
    : '';
  const fonte = f.selo
    ? `<p class="ficha-fonte ficha-carimbo"><span class="selo-freq">${escapar(f.selo)}</span><span>${escapar(f.nota)}</span></p>`
    : `<p class="ficha-fonte">${escapar(f.nota)}</p>`;
  const extras = (f.carimbosExtras ?? []).map((c) => `<p class="ficha-fonte ficha-carimbo">${c.selo ? `<span class="selo-freq">${escapar(c.selo)}</span>` : ''}<span>${escapar(c.texto)}</span></p>`).join('');
  const link = f.link ? `<a class="ficha-link" href="${escapar(f.link.url)}">${escapar(f.link.texto)} →</a>` : '';
  return `<p class="ficha-topo">${escapar(f.topo)}</p>
<div class="ficha-linha"><h2 class="ficha-nome">${escapar(f.nome)}</h2><p class="ficha-valor${f.apagado ? ' sem' : ''}">${valor}</p></div>
${sub}${comp}${det}${link}${f.aviso ? `<p class="ficha-aviso">${escapar(f.aviso)}</p>` : ''}${fonte}${extras}`;
}

export function htmlLegenda(v: Visao): string {
  const titulo = v.legendaTitulo ? `<li class="leg-titulo">${htmlIcone(v.svgs, v.iconeTitulo)}${escapar(v.legendaTitulo)}</li>` : '';
  return titulo + v.legenda.map((l) => `<li class="leg-${l.classe}"><span class="amostra" data-classe="${l.classe}"></span>${htmlIcone(v.svgs, l.icone)}${escapar(l.rotulo)}</li>`).join('');
}
