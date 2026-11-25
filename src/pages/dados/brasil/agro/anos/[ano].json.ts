// Um arquivo por ano antigo (ex.: /dados/brasil/agro/anos/2019.json) com as visões "líder" daquele ano.
// A página baixa esse arquivo só quando a pessoa escolhe o ano (ou aperta "ver a evolução").
import type { APIRoute } from 'astro';
import pais from '../../../../../config/paises/brasil.json';
import { anosProducao, visoesLiderDoAno } from '../../../../../lib/agro';

export function getStaticPaths() {
  return anosProducao(pais, 'estado', 'agro').slice(0, -1).map((ano) => ({ params: { ano } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify({ ano: params.ano, visoes: visoesLiderDoAno(pais, 'agro', params.ano!) }), { headers: { 'content-type': 'application/json' } });
