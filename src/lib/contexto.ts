// Junta o que as páginas de mapa precisam de um país: desenho do mapa,
// lista de lugares e o "contexto" (idioma, moeda, textos, nome do nível).
import { carregarDados, carregarTextos } from './dados';
import type { Contexto, Unidade } from '../componentes/mapa-ranking/visao';

export function contextoDoPais(pais: any, nivelId: string) {
  const geo = carregarDados<any>('geo', pais.arquivos.geo[nivelId]);
  const nivel = pais.niveisGeograficos.find((n: any) => n.id === nivelId);
  if (!nivel) throw new Error(`Nível geográfico "${nivelId}" não está na configuração do país`);
  const ctx: Contexto = {
    idioma: pais.idioma,
    moeda: pais.moeda.codigo,
    textos: carregarTextos(pais.idioma),
    nivelSingular: nivel.singular,
    nivelPlural: nivel.plural,
  };
  const unidades: Unidade[] = geo.unidades.map(({ codigo, sigla, nome, regiao }: Unidade) => ({ codigo, sigla, nome, regiao }));
  return { geo, ctx, unidades, mapa: pais.mapa };
}
