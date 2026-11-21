// Gera um arquivo por produto (ex.: /dados/brasil/agro/soja.json) com a visão "quanto produz".
// A página do Agro baixa esse arquivo só quando a pessoa escolhe o produto, para a página abrir leve.
import type { APIRoute } from 'astro';
import { construirVisaoProduto } from '../../../../componentes/mapa-ranking/construir-producao';
import pais from '../../../../config/paises/brasil.json';
import temaBase from '../../../../config/temas/agro-estados.json';
import iconesAgro from '../../../../config/icones/agro.json';
import { contextoDoPais } from '../../../../lib/contexto';
import { carregarAgro } from '../../../../lib/agro';
const tema = { ...temaBase, icones: iconesAgro };

const agro = () => carregarAgro(pais, 'estado', tema);

export function getStaticPaths() {
  return agro().todos.map((p) => ({ params: { produto: p.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const { todos, porFiltro } = agro();
  const p = todos.find((x) => x.id === params.produto)!;
  const { ctx, unidades } = contextoDoPais(pais, 'estado');
  const visao = construirVisaoProduto(p.id, unidades, porFiltro.tudo, p, 'valor', tema, ctx, true);
  return new Response(JSON.stringify(visao), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
