// Um arquivo por setor (ex.: /dados/brasil/industria/metalurgia.json) com a visão "quanto produz".
// A página da Indústria baixa esse arquivo só quando a pessoa escolhe o setor.
import type { APIRoute } from 'astro';
import pais from '../../../../config/paises/brasil.json';
import { carregarAgro, respostaProduto } from '../../../../lib/agro';

export function getStaticPaths() {
  return carregarAgro(pais, 'estado', 'industria').todos.map((p) => ({ params: { produto: p.id } }));
}

export const GET: APIRoute = ({ params }) => respostaProduto(pais, params.produto!, 'industria');
