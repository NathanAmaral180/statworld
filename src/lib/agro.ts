// Junta os dados do agro de um país e prepara um conjunto para cada filtro do mapa:
// "tudo", "lavouras", "pecuaria". Aceita dois formatos de arquivo:
// - um arquivo só, com "totais" e produtos já marcados com o grupo (ex.: EUA, USDA);
// - dois arquivos, lavouras + pecuária (ex.: Brasil, IBGE + MAPA).
// Os textos de nota (de onde vem cada número) ficam no arquivo do país: pais.agro.notas.
import { carregarDados } from './dados';
import { construirVisaoProduto, type DadosProducao, type Produto } from '../componentes/mapa-ranking/construir-producao';
import type { Valor } from '../componentes/mapa-ranking/visao';
import temaBase from '../config/temas/agro-estados.json';
import iconesAgro from '../config/icones/agro.json';
import { contextoDoPais } from './contexto';
import { preencher } from '../componentes/mapa-ranking/visao';

// Tema do agro já com ícones e com os endereços deste país.
export function temaAgro(pais: any) {
  const vars = { caminho: pais.caminho, pais: pais.slug, produto: '{produto}' };
  return {
    ...temaBase,
    icones: iconesAgro,
    urlProduto: preencher(temaBase.urlProduto, vars),
    urlDadosProduto: preencher(temaBase.urlDadosProduto, vars),
  };
}

export function carregarAgro(pais: any, nivel: string) {
  const notas = pais.agro?.notas ?? {};
  const principal = carregarDados<any>('agro', pais.arquivos.agro[nivel]);
  let lavouras: Produto[], pecuaria: Produto[];
  let totais: Record<'tudo' | 'lavouras' | 'pecuaria', Record<string, Valor>>;
  let fontes: Record<'tudo' | 'lavouras' | 'pecuaria', any[]>;
  const periodo: string = principal.periodo;

  if (principal.totais) {
    // Formato de um arquivo só.
    const todos: Produto[] = principal.produtos.map((p: Produto) => ({ ...p, fontes: p.fontes ?? principal.fontes }));
    lavouras = todos.filter((p) => p.grupo === 'lavouras');
    pecuaria = todos.filter((p) => p.grupo === 'pecuaria');
    totais = principal.totais;
    fontes = { tudo: principal.fontes, lavouras: principal.fontes, pecuaria: principal.fontes };
  } else {
    // Formato lavouras + pecuária em arquivos separados.
    const pec = carregarDados<any>('agro', pais.arquivos.pecuaria[nivel]);
    if (periodo !== pec.periodo) throw new Error(`Lavouras (${periodo}) e pecuária (${pec.periodo}) são de anos diferentes`);
    lavouras = principal.produtos.map((p: Produto) => ({ ...p, grupo: 'lavouras', fontes: principal.fontes }));
    pecuaria = pec.produtos.map((p: Produto) => ({
      ...p,
      grupo: 'pecuaria',
      nota: p.fontes?.some((f) => notas.avisoPorFonte?.[f.nome]) ? notas.avisoPorFonte[p.fontes!.find((f) => notas.avisoPorFonte[f.nome])!.nome] : undefined,
    }));
    // Total da pecuária em cada lugar = soma dos produtos (sem dado não entra; se tudo for sem dado, fica sem dado).
    const somaPec: Record<string, Valor> = {};
    for (const uf of Object.keys(principal.totalLavouras)) {
      const vals = pecuaria.map((p) => p.valores[uf]).filter((v): v is number => v !== null && v !== undefined);
      somaPec[uf] = vals.length ? vals.reduce((s, v) => s + v, 0) : null;
    }
    const somaTudo = Object.fromEntries(
      Object.entries(principal.totalLavouras as Record<string, Valor>).map(([uf, v]) => [uf, v === null ? null : v + (somaPec[uf] ?? 0)])
    );
    totais = { tudo: somaTudo, lavouras: principal.totalLavouras, pecuaria: somaPec };
    fontes = { tudo: [...principal.fontes, ...pec.fontes], lavouras: principal.fontes, pecuaria: pec.fontes };
  }

  const todos = [...lavouras, ...pecuaria].sort((a, b) => (b.valorPais ?? 0) - (a.valorPais ?? 0));
  const porFiltro: Record<string, DadosProducao> = {
    tudo: { periodo, fontes: fontes.tudo, abrangencia: notas.tudo, total: totais.tudo, produtos: todos },
    lavouras: { periodo, fontes: fontes.lavouras, abrangencia: notas.lavouras, total: totais.lavouras, produtos: lavouras },
    pecuaria: { periodo, fontes: fontes.pecuaria, abrangencia: notas.pecuaria, total: totais.pecuaria, produtos: pecuaria },
  };
  return { todos, porFiltro, periodo };
}

// Arquivo JSON de um produto ("quanto produz"), baixado pela página do Agro sob demanda.
export function respostaProduto(pais: any, id: string): Response {
  const tema = temaAgro(pais);
  const { todos, porFiltro } = carregarAgro(pais, 'estado');
  const p = todos.find((x) => x.id === id)!;
  const { ctx, unidades } = contextoDoPais(pais, 'estado');
  const visao = construirVisaoProduto(p.id, unidades, porFiltro.tudo, p, 'valor', tema, ctx, true);
  return new Response(JSON.stringify(visao), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
