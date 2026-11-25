// Um arquivo por país, aba e ano (ex.: /dados/brasil/economia/visao-geral/2015.json) com as visões do mapa daquele ano.
// A página baixa esse arquivo só quando a pessoa escolhe o ano (ou aperta "ver a evolução").
import type { APIRoute } from 'astro';
import brasil from '../../../../../config/paises/brasil.json';
import eua from '../../../../../config/paises/estados-unidos.json';
import { CONFIGS, temAnos, serieDeAnos, visoesDoAno } from '../../../../../lib/economia-abas';

const PAISES: any[] = [brasil, eua];

export function getStaticPaths() {
  return PAISES.flatMap((pais) =>
    Object.keys(CONFIGS)
      .filter((aba) => temAnos(pais, aba))
      .flatMap((aba) => serieDeAnos(pais).anos.map((ano: string) => ({ params: { pais: pais.slug, aba, ano }, props: { pais } })))
  );
}

export const GET: APIRoute = ({ params, props }) =>
  new Response(JSON.stringify({ ano: params.ano, visoes: visoesDoAno(props.pais, params.aba!, params.ano!) }), {
    headers: { 'content-type': 'application/json' },
  });
