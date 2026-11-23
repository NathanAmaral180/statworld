// Junta os dados de produção de um país (agro, indústria…) e prepara um conjunto para cada filtro
// do mapa (ex.: agro: "tudo", "lavouras", "pecuaria"; indústria: "tudo", "extrativa", "transformacao").
// Aceita dois formatos de arquivo:
// - um arquivo só, com "totais" por filtro e itens já marcados com o grupo (ex.: EUA/USDA, indústria/IBGE);
// - agro do Brasil: dois arquivos, lavouras + pecuária (IBGE + MAPA).
// Os textos de nota (de onde vem cada número) ficam no arquivo do país: pais.<tema>.notas.
// Quando a medida do país é outra (ex.: EUA mede valor adicionado, o Brasil o valor da transformação), o arquivo do país
// troca textos, opções, apelidos dos ícones e o produto padrão em pais.<tema>.sobrescrever.
import { carregarDados } from './dados';
import { construirVisaoProduto, type DadosProducao, type Produto } from '../componentes/mapa-ranking/construir-producao';
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

export function carregarAgro(pais: any, nivel: string, tema = 'agro') {
  const cfg = temaAgro(pais, tema);
  const notas = pais[tema]?.notas ?? {};
  const principal = carregarDados<any>(tema, pais.arquivos[tema][nivel]);
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
    const pec = carregarDados<any>(tema, pais.arquivos.pecuaria[nivel]);
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
