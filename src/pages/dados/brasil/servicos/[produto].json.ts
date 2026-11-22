// Um arquivo por atividade (ex.: /dados/brasil/servicos/comercio.json) com a visão "quanto produz".
import type { APIRoute } from 'astro';
import pais from '../../../../config/paises/brasil.json';
import { carregarAgro, respostaProduto } from '../../../../lib/agro';

export function getStaticPaths() {
  return carregarAgro(pais, 'estado', 'servicos').todos.map((p) => ({ params: { produto: p.id } }));
}

export const GET: APIRoute = ({ params }) => respostaProduto(pais, params.produto!, 'servicos');
