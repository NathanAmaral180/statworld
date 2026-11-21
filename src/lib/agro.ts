// Junta os dados do agro de um país (lavouras + pecuária) e prepara um conjunto
// para cada filtro do mapa: "tudo", "lavouras", "pecuaria".
import { carregarDados } from './dados';
import type { DadosProducao, Produto } from '../componentes/mapa-ranking/construir-producao';
import type { Valor } from '../componentes/mapa-ranking/visao';

export function carregarAgro(pais: any, nivel: string, tema: any) {
  const lav = carregarDados<any>('agro', pais.arquivos.agro[nivel]);
  const pec = carregarDados<any>('agro', pais.arquivos.pecuaria[nivel]);
  if (lav.periodo !== pec.periodo) throw new Error(`Lavouras (${lav.periodo}) e pecuária (${pec.periodo}) são de anos diferentes`);

  const lavouras: Produto[] = lav.produtos.map((p: Produto) => ({ ...p, grupo: 'lavouras', fontes: lav.fontes }));
  const pecuaria: Produto[] = pec.produtos.map((p: Produto) => ({
    ...p,
    grupo: 'pecuaria',
    nota: p.fontes?.some((f) => f.nome === 'MAPA') ? tema.textos.notaVbp : undefined,
  }));
  const todos = [...lavouras, ...pecuaria].sort((a, b) => (b.valorBrasil ?? 0) - (a.valorBrasil ?? 0));

  // Total da pecuária em cada lugar = soma dos produtos (sem dado não entra; se tudo for sem dado, fica sem dado).
  const somaPec: Record<string, Valor> = {};
  for (const uf of Object.keys(lav.totalLavouras)) {
    const vals = pecuaria.map((p) => p.valores[uf]).filter((v): v is number => v !== null && v !== undefined);
    somaPec[uf] = vals.length ? vals.reduce((s, v) => s + v, 0) : null;
  }
  const somaTudo: Record<string, Valor> = Object.fromEntries(
    Object.entries(lav.totalLavouras as Record<string, Valor>).map(([uf, v]) => [uf, v === null ? null : v + (somaPec[uf] ?? 0)])
  );

  const base = { periodo: lav.periodo as string };
  const porFiltro: Record<string, DadosProducao> = {
    tudo: { ...base, fontes: [...lav.fontes, ...pec.fontes], abrangencia: tema.textos.notaTudo, total: somaTudo, produtos: todos },
    lavouras: { ...base, fontes: lav.fontes, abrangencia: tema.textos.notaLavouras, total: lav.totalLavouras, produtos: lavouras },
    pecuaria: { ...base, fontes: pec.fontes, abrangencia: tema.textos.notaPecuaria, total: somaPec, produtos: pecuaria },
  };
  return { todos, porFiltro, periodo: lav.periodo as string };
}
