// Lê o cadastro de temas, abas e subdivisões (src/config/catalogo.json).
// Menu do topo, abas e página inicial vêm daqui: nenhuma lista de temas fica escrita nas páginas.
import catalogo from '../config/catalogo.json';

export type Tema = (typeof catalogo.temas)[number] & { nomeCurto?: string; href?: string; cabecalho?: boolean; numeroDoMundo?: string };

export const temas = catalogo.temas as Tema[];
export const grupos = catalogo.grupos;
export const lentes = catalogo.lentes;

// Temas do menu do topo.
export const temasDoCabecalho = () =>
  temas.filter((t) => t.cabecalho).map((t) => ({ id: t.id, nome: t.nomeCurto ?? t.nome, href: t.href, ativo: t.situacao === 'no-ar' && !!t.href }));

// Temas agrupados (para a lista "Todos os temas").
export const temasPorGrupo = () => grupos.map((g) => ({ ...g, temas: temas.filter((t) => t.grupo === g.id) }));

// Abas de um tema para um país: a aba só fica ativa se tem página no ar e o país tem a aba
// (campo "subtemas" no arquivo do país). As demais aparecem como "em breve".
export function abasDe(temaId: string, pais: any) {
  const tema = temas.find((t) => t.id === temaId) as any;
  if (!tema?.abas) return [];
  const doPais: string[] = pais.subtemas?.[temaId] ?? [];
  const grupo = Object.fromEntries(tema.abas.grupos.map((g: any) => [g.id, g]));
  return tema.abas.itens.map((a: any) => ({
    id: a.id,
    nome: a.nome,
    nomeCurto: a.nomeCurto,
    grupo: grupo[a.grupo]?.nome,
    grupoId: a.grupo,
    grupoCurto: grupo[a.grupo]?.nomeCurto ?? grupo[a.grupo]?.nome,
    href: a.href ? pais.caminho + a.href : undefined,
    ativo: a.situacao === 'no-ar' && !!a.href && doPais.includes(a.id),
  }));
}
