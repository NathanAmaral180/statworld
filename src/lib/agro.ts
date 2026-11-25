// Junta os dados de produção de um país (agro, indústria…) e prepara um conjunto para cada filtro
// do mapa (ex.: agro: "tudo", "lavouras", "pecuaria"; indústria: "tudo", "extrativa", "transformacao").
// Aceita dois formatos de arquivo:
// - um arquivo só, com "totais" por filtro e itens já marcados com o grupo (ex.: EUA/USDA, indústria/IBGE);
// - agro do Brasil: dois arquivos, lavouras + pecuária (IBGE + MAPA).
// Os textos de nota (de onde vem cada número) ficam no arquivo do país: pais.<tema>.notas.
// Quando a medida do país é outra (ex.: EUA mede valor adicionado, o Brasil o valor da transformação), o arquivo do país
// troca textos, opções, apelidos dos ícones e o produto padrão em pais.<tema>.sobrescrever.
import { carregarDados, listarDados } from './dados';
import { construirVisaoProduto, construirVisaoLider, type DadosProducao, type Produto } from '../componentes/mapa-ranking/construir-producao';
import type { Valor } from '../componentes/mapa-ranking/visao';
import { contextoDoPais } from './contexto';
import { preencher } from '../componentes/mapa-ranking/visao';

const temas = import.meta.glob('../config/temas/*-estados.json', { eager: true, import: 'default' });
const conjuntosIcones = import.meta.glob('../config/icones/*.json', { eager: true, import: 'default' });

// Tema (agro, industria…) já com ícones e com os endereços deste país.
export function temaAgro(pais: any, tema = 'agro') {
  const base = temas[`../config/temas/${tema}-estados.json`] as any;
  if (!base) throw new Error(`Tema não encontrado: src/config/temas/${tema}-estados.json`);
  const icones = conjuntosIcones[`../config/icones/${tema}.json`] as any;
  const vars = { caminho: pais.caminho, pais: pais.slug, produto: '{produto}' };
  const s = pais[tema]?.sobrescrever ?? {};
  return {
    ...base,
    ...s,
    textos: { ...base.textos, ...s.textos },
    textosMolde: { ...base.textosMolde, ...s.textosMolde },
    opcoes: { ...base.opcoes, ...s.opcoes },
    apelidos: { ...base.apelidos, ...s.apelidos },
    id: tema,
    icones,
    urlProduto: preencher(base.urlProduto, vars),
    urlDadosProduto: preencher(base.urlDadosProduto, vars),
  };
}

// Anos disponíveis de um tema: os antigos (dados/<tema>/anos/<arquivo>-<ano>.json, de scripts/anos-producao/) + o mais recente.
// No agro do Brasil, um ano só entra se tiver lavouras e pecuária.
export function anosProducao(pais: any, nivel: string, tema = 'agro'): string[] {
  const arq = pais.arquivos[tema][nivel];
  const ultimo = carregarDados<any>(tema, arq).periodo as string;
  const deArquivo = (nome: string) => new Set(listarDados(tema, `anos/${nome}-`).map((n) => n.slice(-4)));
  let antigos = deArquivo(arq);
  if (pais.arquivos.pecuaria?.[nivel] && tema === 'agro') {
    const pec = deArquivo(pais.arquivos.pecuaria[nivel]);
    antigos = new Set([...antigos].filter((a) => pec.has(a)));
  }
  return [...antigos].filter((a) => a < ultimo).sort().concat(ultimo);
}

// ano: um ano antigo (ver anosProducao); sem ano, o mais recente.
export function carregarAgro(pais: any, nivel: string, tema = 'agro', ano?: string) {
  const cfg = temaAgro(pais, tema);
  const notas = pais[tema]?.notas ?? {};
  const nomeDe = (nome: string) => (ano ? `anos/${nome}-${ano}` : nome);
  const atual = carregarDados<any>(tema, pais.arquivos[tema][nivel]);
  const principal = ano && ano !== atual.periodo ? carregarDados<any>(tema, nomeDe(pais.arquivos[tema][nivel])) : atual;
  const doAno = principal !== atual;
  const periodo: string = principal.periodo;
  const filtros: string[] = cfg.filtros.map((f: any) => f.id);

  let todos: Produto[];
  let totais: Record<string, Record<string, Valor>>;
  let fontes: Record<string, any[]>;

  if (principal.totais) {
    // Formato de um arquivo só: os totais já vêm por filtro.
    todos = principal.produtos.map((p: Produto) => ({ ...p, fontes: p.fontes ?? principal.fontes }));
    totais = principal.totais;
    fontes = Object.fromEntries(filtros.map((f) => [f, principal.fontes]));
  } else {
    // Agro do Brasil: lavouras + pecuária em arquivos separados.
    const pec = carregarDados<any>(tema, doAno ? nomeDe(pais.arquivos.pecuaria[nivel]) : pais.arquivos.pecuaria[nivel]);
    if (periodo !== pec.periodo) throw new Error(`Lavouras (${periodo}) e pecuária (${pec.periodo}) são de anos diferentes`);
    const lavouras = principal.produtos.map((p: Produto) => ({ ...p, grupo: 'lavouras', fontes: principal.fontes }));
    const pecuaria = pec.produtos.map((p: Produto) => ({
      ...p,
      grupo: 'pecuaria',
      nota: p.fontes?.some((f) => notas.avisoPorFonte?.[f.nome]) ? notas.avisoPorFonte[p.fontes!.find((f) => notas.avisoPorFonte[f.nome])!.nome] : undefined,
    }));
    todos = [...lavouras, ...pecuaria];
    // Total da pecuária em cada lugar = soma dos produtos (sem dado não entra; se tudo for sem dado, fica sem dado).
    const somaPec: Record<string, Valor> = {};
    for (const uf of Object.keys(principal.totalLavouras)) {
      const vals = pecuaria.map((p: Produto) => p.valores[uf]).filter((v: Valor): v is number => v !== null && v !== undefined);
      somaPec[uf] = vals.length ? vals.reduce((s: number, v: number) => s + v, 0) : null;
    }
    const somaTudo = Object.fromEntries(
      Object.entries(principal.totalLavouras as Record<string, Valor>).map(([uf, v]) => [uf, v === null ? null : v + (somaPec[uf] ?? 0)])
    );
    totais = { tudo: somaTudo, lavouras: principal.totalLavouras, pecuaria: somaPec };
    fontes = { tudo: [...principal.fontes, ...pec.fontes], lavouras: principal.fontes, pecuaria: pec.fontes };
  }

  todos.sort((a, b) => (b.valorPais ?? 0) - (a.valorPais ?? 0));
  const porFiltro: Record<string, DadosProducao> = Object.fromEntries(filtros.map((f) => [f, {
    periodo,
    fontes: fontes[f],
    abrangencia: notas[f],
    total: totais[f],
    produtos: f === 'tudo' ? todos : todos.filter((p) => p.grupo === f),
    oculto: f === 'tudo' ? principal.escondidoPorSigilo : undefined,
  }]));
  return { todos, porFiltro, periodo };
}

// Arquivo JSON de um item ("quanto produz"), baixado pela página sob demanda.
export function respostaProduto(pais: any, id: string, tema = 'agro'): Response {
  const cfg = temaAgro(pais, tema);
  const { todos, porFiltro } = carregarAgro(pais, 'estado', tema);
  const p = todos.find((x) => x.id === id)!;
  const { ctx, unidades } = contextoDoPais(pais, 'estado');
  const ctxTema = { ...ctx, textos: { ...ctx.textos, ...(cfg.textosMolde ?? {}) } };
  const visao = construirVisaoProduto(p.id, unidades, porFiltro.tudo, p, 'valor', cfg, ctxTema, true);
  return new Response(JSON.stringify(visao), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

// ---------- Anos antigos (seletor de ano / "ver a evolução") ----------
// Ficha de um ano antigo: aviso de que os reais são daquele ano e onde o lugar estava no ano mais recente.
// avisoExtra: nota do país para anos antigos (ex.: mudança de série da pesquisa da indústria).
function compararComUltimo(v: any, vu: any, ctx: any, ano: string, ultimo: string, avisoExtra?: string) {
  const t = ctx.textos;
  const linhaUltimo = Object.fromEntries(vu.linhas.map((l: any) => [l.uf, l]));
  for (const [uf, f] of Object.entries(v.fichas) as [string, any][]) {
    const l = linhaUltimo[uf];
    if (l) f.detalhes = [...(f.detalhes ?? []), [preencher(t.emAno, { ano: ultimo }), l.pos ? `${l.pos}º · ${l.texto}` : l.texto]];
    if (!f.apagado) f.aviso = [f.aviso, preencher(t.reaisDoAno, { ano }), avisoExtra].filter(Boolean).join(' ');
  }
  return v;
}

// Visões "produto líder" (tudo / lavouras / pecuária…) de um ano.
export function visoesLiderDoAno(pais: any, tema: string, ano: string) {
  const cfg = temaAgro(pais, tema);
  const { ctx: ctxPais, unidades } = contextoDoPais(pais, 'estado');
  const ctx = { ...ctxPais, textos: { ...ctxPais.textos, ...(cfg.textosMolde ?? {}) } };
  const anos = anosProducao(pais, 'estado', tema);
  const ultimo = anos.at(-1)!;
  const { porFiltro } = carregarAgro(pais, 'estado', tema, ano);
  const atual = ano === ultimo ? null : carregarAgro(pais, 'estado', tema).porFiltro;
  return Object.fromEntries(cfg.filtros.map((f: any) => {
    const v = construirVisaoLider(`lider-${f.id}`, unidades, porFiltro[f.id], cfg, ctx, f.grupoTexto);
    return [`lider-${f.id}`, atual ? compararComUltimo(v, construirVisaoLider(`lider-${f.id}`, unidades, atual[f.id], cfg, ctx, f.grupoTexto), ctx, ano, ultimo, pais[tema]?.notas?.avisoAnosAntigos) : v];
  }));
}

// Visão "quanto produz" de um produto num ano. Produto que não aparece naquele ano: todos os lugares "sem dado".
export function visaoProdutoDoAno(pais: any, tema: string, id: string, ano: string) {
  const cfg = temaAgro(pais, tema);
  const { ctx: ctxPais, unidades } = contextoDoPais(pais, 'estado');
  const ctx = { ...ctxPais, textos: { ...ctxPais.textos, ...(cfg.textosMolde ?? {}) } };
  const ultimo = anosProducao(pais, 'estado', tema).at(-1)!;
  const atual = carregarAgro(pais, 'estado', tema);
  const pAtual = atual.todos.find((x) => x.id === id)!;
  const doAno = carregarAgro(pais, 'estado', tema, ano);
  const vazio = Object.fromEntries(unidades.map((u) => [u.sigla, null]));
  const p = doAno.todos.find((x) => x.id === id) ?? { ...pAtual, valores: vazio, quantidades: vazio, valorPais: null, quantidadePais: null };
  const v = construirVisaoProduto(p.id, unidades, doAno.porFiltro.tudo, p, 'valor', cfg, ctx, true);
  if (ano === ultimo) return v;
  return compararComUltimo(v, construirVisaoProduto(pAtual.id, unidades, atual.porFiltro.tudo, pAtual, 'valor', cfg, ctx, true), ctx, ano, ultimo, pais[tema]?.notas?.avisoAnosAntigos);
}
