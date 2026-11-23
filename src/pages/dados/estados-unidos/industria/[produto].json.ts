// Um arquivo por item de Indústria dos EUA, baixado pela página só quando a pessoa escolhe o item.
import type { APIRoute } from 'astro';
import pais from '../../../../config/paises/estados-unidos.json';
import { carregarAgro, respostaProduto } from '../../../../lib/agro';

export function getStaticPaths() {
  return carregarAgro(pais, 'estado', 'industria').todos.map((p) => ({ params: { produto: p.id } }));
}

export const GET: APIRoute = ({ params }) => respostaProduto(pais, params.produto!, 'industria');
