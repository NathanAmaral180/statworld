// Gera um arquivo por produto (ex.: /dados/brasil/agro/soja.json) com a visão "quanto produz".
// A página do Agro baixa esse arquivo só quando a pessoa escolhe o produto, para a página abrir leve.
import type { APIRoute } from 'astro';
import { construirVisaoProduto, type DadosProducao } from '../../../../componentes/mapa-ranking/construir-producao';
import pais from '../../../../config/paises/brasil.json';
import temaBase from '../../../../config/temas/agro-estados.json';
import iconesAgro from '../../../../config/icones/agro.json';
import { carregarDados } from '../../../../lib/dados';
import { contextoDoPais } from '../../../../lib/contexto';
const tema = { ...temaBase, icones: iconesAgro };

const dados = () => carregarDados<DadosProducao>('agro', pais.arquivos.agro.estado);

export function getStaticPaths() {
  return dados().produtos.map((p) => ({ params: { produto: p.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const d = dados();
  const p = d.produtos.find((x) => x.id === params.produto)!;
  const { ctx, unidades } = contextoDoPais(pais, 'estado');
  const visao = construirVisaoProduto(p.id, unidades, d, p, 'valor', tema, ctx, true);
  return new Response(JSON.stringify(visao), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
