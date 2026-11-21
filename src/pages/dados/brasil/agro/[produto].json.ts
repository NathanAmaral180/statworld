// Um arquivo por produto (ex.: /dados/brasil/agro/soja.json) com a visão "quanto produz".
// A página do Agro baixa esse arquivo só quando a pessoa escolhe o produto.
import type { APIRoute } from 'astro';
import pais from '../../../../config/paises/brasil.json';
import { carregarAgro, respostaProduto } from '../../../../lib/agro';

export function getStaticPaths() {
  return carregarAgro(pais, 'estado').todos.map((p) => ({ params: { produto: p.id } }));
}

export const GET: APIRoute = ({ params }) => respostaProduto(pais, params.produto!);
