// Um arquivo por produto e ano antigo (ex.: /dados/brasil/agro/soja/2019.json) com a visão "quanto produz" daquele ano.
import type { APIRoute } from 'astro';
import pais from '../../../../../config/paises/brasil.json';
import { anosProducao, carregarAgro, visaoProdutoDoAno } from '../../../../../lib/agro';

export function getStaticPaths() {
  const anos = anosProducao(pais, 'estado', 'agro').slice(0, -1);
  return carregarAgro(pais, 'estado', 'agro').todos.flatMap((p) => anos.map((ano) => ({ params: { produto: p.id, ano } })));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(visaoProdutoDoAno(pais, 'agro', params.produto!, params.ano!)), { headers: { 'content-type': 'application/json' } });
