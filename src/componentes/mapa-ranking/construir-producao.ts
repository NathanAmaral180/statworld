// Monta as visões de produção por produto (ex.: lavouras do agro):
// - "líder": cada lugar pintado com a cor do seu principal produto;
// - "produto": quanto cada lugar produz de um produto (valor ou quantidade).
// Serve para qualquer país/tema que tenha dados no formato "produtos por lugar".
import {
  barras, classeSequencial, formatar, formatarEmPartes, htmlFontes, preencher, rotulosCortes,
  type Contexto, type Fonte, type Unidade, type Visao, type Valor, type OpcoesNumero,
} from './visao';

export interface Produto {
  id: string;
  nome: string;
  grupo?: string; // ex.: "lavouras", "pecuaria"
  fontes?: Fonte[]; // quando o produto tem fonte própria
  nota?: string; // aviso sobre o produto (ex.: estados não estimados)
  unidadeQuantidade: string | null; // null = não há quantidade
  valorPais: number | null;
  quantidadePais: number | null;
  valores: Record<string, Valor>; // 0 = não produz; null = sem dado
  quantidades: Record<string, Valor>;
}

export interface DadosProducao {
  periodo: string;
  fontes: Fonte[];
  abrangencia?: string;
  total: Record<string, Valor>; // valor total de cada lugar (soma do grupo)
  produtos: Produto[];
}

export interface ConfigProducao {
  textos: Record<string, string>; // títulos do tema (com {periodo}, {produto})
  apelidos: Record<string, string>; // produto -> nome do ícone/cor, quando diferente (ex.: cana-de-acucar -> cana)
  icones: { comCor: string[]; icones: Record<string, string> }; // de src/config/icones/
  cortesParticipacao: number[];
  urlProduto?: string; // ex.: "/economia/agro/{produto}"
}

const fmtValor: OpcoesNumero = { formato: 'moeda', casas: 1, compacto: true };
const fmtQuant = (p: Produto): OpcoesNumero => ({ formato: 'numero', casas: 1, compacto: true, sufixo: ' ' + (p.unidadeQuantidade ?? '') });
const fontesDe = (p: Produto, dados: DadosProducao) => p.fontes ?? dados.fontes;
const fmtPct: OpcoesNumero = { formato: 'percentual', casas: 1 };

const apelido = (cfg: ConfigProducao, id: string) => cfg.apelidos[id] ?? id;
export const temCor = (cfg: ConfigProducao, id: string) => cfg.icones.comCor.includes(apelido(cfg, id));
export const corDoProduto = (cfg: ConfigProducao, id: string) => (temCor(cfg, id) ? `p-${apelido(cfg, id)}` : 'p-outro');
export const iconeDoProduto = (cfg: ConfigProducao, id: string) => (cfg.icones.icones[apelido(cfg, id)] ? apelido(cfg, id) : 'outro');
// Só os desenhos usados nesta visão (para a página ficar leve).
const desenhos = (cfg: ConfigProducao, nomes: string[]) => Object.fromEntries([...new Set(nomes)].filter((n) => cfg.icones.icones[n]).map((n) => [n, cfg.icones.icones[n]]));

function nota(cfg: ConfigProducao, dados: DadosProducao, chave: string, vars: Record<string, string> = {}, fontes = dados.fontes) {
  return `${preencher(cfg.textos[chave], { periodo: dados.periodo, ...vars })} · ${fontes.map((f) => `${f.nome}, ${f.publicacao}`).join('; ')}`;
}

// Posição de cada lugar entre os produtores de um produto (1 = maior).
function posicoes(valores: Record<string, Valor>): Map<string, number> {
  const ordem = Object.entries(valores).filter(([, v]) => v !== null && v > 0).sort((a, b) => (b[1] as number) - (a[1] as number));
  return new Map(ordem.map(([uf], i) => [uf, i + 1]));
}

// ---------- produto líder ----------
// grupoTexto: como o grupo aparece nas frases (ex.: "do agro", "das lavouras").
export function construirVisaoLider(id: string, unidades: Unidade[], dados: DadosProducao, cfg: ConfigProducao, ctx: Contexto, grupoTexto = ''): Visao {
  const t = ctx.textos;
  const lider: Record<string, Produto | null> = {};
  for (const u of unidades) {
    let melhor: Produto | null = null;
    for (const p of dados.produtos) {
      const v = p.valores[u.sigla];
      if (v !== null && v > 0 && (!melhor || v > (melhor.valores[u.sigla] as number))) melhor = p;
    }
    lider[u.sigla] = melhor;
  }
  const total = (uf: string) => dados.total[uf] ?? null;
  const comDado = unidades.filter((u) => total(u.sigla) !== null).sort((a, b) => (total(b.sigla) as number) - (total(a.sigla) as number));
  const semDado = unidades.filter((u) => total(u.sigla) === null).sort((a, b) => a.nome.localeCompare(b.nome, ctx.idioma));
  const ordem = [...comDado, ...semDado];
  const n = comDado.length;
  const bs = barras(ordem.map((u) => total(u.sigla)));
  const vars = { periodo: dados.periodo, grupo: grupoTexto };
  const medida = preencher(cfg.textos.medidaTotal, vars);

  const classe = (uf: string) => (total(uf) === null ? 'sem' : lider[uf] ? corDoProduto(cfg, lider[uf]!.id) : 'zero');

  // Legenda: produtos líderes, na ordem do valor no país; "outros" no fim.
  const lideres = [...new Set(Object.values(lider).filter(Boolean) as Produto[])].sort((a, b) => (b.valorPais ?? 0) - (a.valorPais ?? 0));
  const legenda: Visao['legenda'] = lideres.filter((p) => temCor(cfg, p.id)).map((p) => ({ classe: corDoProduto(cfg, p.id), rotulo: p.nome, icone: iconeDoProduto(cfg, p.id) }));
  const outros = lideres.filter((p) => !temCor(cfg, p.id));
  if (outros.length) legenda.push({ classe: 'p-outro', rotulo: `${t.outrosProdutos} (${outros.map((p) => p.nome).join(', ')})`, icone: 'outro' });
  if (semDado.length) legenda.push({ classe: 'sem', rotulo: preencher(t.legendaSemDado, { n: semDado.length, nivel: semDado.length === 1 ? ctx.nivelSingular : ctx.nivelPlural }) });

  const posPorProduto = new Map(dados.produtos.map((p) => [p.id, posicoes(p.valores)]));

  return {
    id,
    titulo: medida,
    classes: Object.fromEntries(unidades.map((u) => [u.sigla, classe(u.sigla)])),
    legenda,
    legendaTitulo: preencher(cfg.textos.legendaLider, vars),
    icones: Object.fromEntries(unidades.filter((u) => lider[u.sigla]).map((u) => [u.sigla, iconeDoProduto(cfg, lider[u.sigla]!.id)])),
    svgs: desenhos(cfg, [...lideres.map((p) => iconeDoProduto(cfg, p.id)), 'outro']),
    linhas: ordem.map((u, i) => ({
      uf: u.sigla,
      nome: u.nome,
      pos: i < n ? i + 1 : null,
      texto: formatar(total(u.sigla), fmtValor, ctx),
      barra: bs[i],
      icone: lider[u.sigla] ? iconeDoProduto(cfg, lider[u.sigla]!.id) : undefined,
      tipo: i < n ? undefined : 'sem',
    })),
    fichas: Object.fromEntries(
      ordem.map((u, i) => {
        const p = lider[u.sigla];
        const pos = i < n ? preencher(t.posicaoEm, { n: i + 1, total: n, medida: cfg.textos.medidaCurta }) : t.semDado;
        const ficha = {
          topo: `${u.regiao} · ${pos}`,
          nome: u.nome,
          ...formatarEmPartes(total(u.sigla), fmtValor, ctx),
          apagado: total(u.sigla) === null,
          nota: nota(cfg, dados, 'medidaTotal', vars),
          ...(p
            ? {
                subtitulo: `${p.nome} · ${preencher(t.maiorProdutor, { n: posPorProduto.get(p.id)!.get(u.sigla)! })}`,
                icone: iconeDoProduto(cfg, p.id),
                detalhes: [[t.produtoLider, `${p.nome} · ${formatar(p.valores[u.sigla], fmtValor, ctx)}`], [t.fonteDoProduto, fontesDe(p, dados).map((f) => f.nome).join(', ')]] as [string, string][],
                link: cfg.urlProduto ? { texto: preencher(t.verProduto, { produto: p.nome }), url: preencher(cfg.urlProduto, { produto: p.id }) } : undefined,
              }
            : {}),
        };
        return [u.sigla, ficha];
      })
    ),
    fonte: htmlFontes(dados.fontes, ctx, dados.abrangencia),
  };
}

// ---------- quanto produz (um produto) ----------
export function construirVisaoProduto(
  id: string, unidades: Unidade[], dados: DadosProducao, p: Produto, modo: 'valor' | 'quantidade',
  cfg: ConfigProducao, ctx: Contexto, comLink = false
): Visao {
  const t = ctx.textos;
  const vals = modo === 'valor' ? p.valores : p.quantidades;
  const brasil = modo === 'valor' ? p.valorPais : p.quantidadePais;
  const fmt = modo === 'valor' ? fmtValor : fmtQuant(p);
  const outro = modo === 'valor' ? p.quantidades : p.valores;
  const fmtOutro = modo === 'valor' ? fmtQuant(p) : fmtValor;
  const v = (uf: string) => vals[uf] ?? null;
  const part = (uf: string): Valor => (v(uf) === null || !brasil ? null : ((v(uf) as number) / brasil) * 100);

  const produtores = unidades.filter((u) => (v(u.sigla) ?? 0) > 0).sort((a, b) => (v(b.sigla) as number) - (v(a.sigla) as number));
  const naoProduz = unidades.filter((u) => v(u.sigla) === 0).sort((a, b) => a.nome.localeCompare(b.nome, ctx.idioma));
  const semDado = unidades.filter((u) => v(u.sigla) === null).sort((a, b) => a.nome.localeCompare(b.nome, ctx.idioma));
  const ordem = [...produtores, ...naoProduz, ...semDado];
  const n = produtores.length;
  const bs = barras(ordem.map((u) => (v(u.sigla) ? v(u.sigla) : null)));
  const chave = modo === 'valor' ? 'medidaProdutoValor' : 'medidaProdutoQuantidade';
  const nomeFrase = p.nome.toLocaleLowerCase(ctx.idioma);
  const titulo = preencher(cfg.textos[chave], { periodo: dados.periodo, produto: nomeFrase });

  const classe = (uf: string) => (v(uf) === null ? 'sem' : v(uf) === 0 ? 'zero' : classeSequencial(part(uf), cfg.cortesParticipacao));
  const legenda = rotulosCortes(cfg.cortesParticipacao, fmtPct, ctx).map((rotulo, i) => ({ classe: 'c' + i, rotulo }));
  if (naoProduz.length) legenda.push({ classe: 'zero', rotulo: `${t.legendaNaoProduz} (${naoProduz.length})` });
  if (semDado.length) legenda.push({ classe: 'sem', rotulo: preencher(t.legendaSemDado, { n: semDado.length, nivel: semDado.length === 1 ? ctx.nivelSingular : ctx.nivelPlural }) });

  return {
    id,
    titulo,
    classes: Object.fromEntries(unidades.map((u) => [u.sigla, classe(u.sigla)])),
    legenda,
    legendaTitulo: t.legendaParticipacao,
    linhas: ordem.map((u, i) => ({
      uf: u.sigla,
      nome: u.nome,
      pos: i < n ? i + 1 : null,
      texto: v(u.sigla) === 0 ? t.naoProduz : formatar(v(u.sigla), fmt, ctx),
      barra: bs[i],
      tipo: i < n ? undefined : v(u.sigla) === 0 ? 'zero' : 'sem',
    })),
    fichas: Object.fromEntries(
      ordem.map((u, i) => {
        const val = v(u.sigla);
        const pos = i < n ? preencher(t.posicaoProdutores, { n: i + 1, total: n, nivel: ctx.nivelPlural }) : val === 0 ? t.naoProduz : t.semDado;
        const partes = val === 0 ? { antes: '', numero: t.naoProduz, depois: '' } : formatarEmPartes(val, fmt, ctx);
        const detalhes: [string, string][] = val
          ? [
              [t.participacaoNoPais, formatar(part(u.sigla), fmtPct, ctx)],
              ...(p.unidadeQuantidade || modo === 'quantidade'
                ? [[modo === 'valor' ? t.quantidadeProduzida : t.valorDaProducao, formatar(outro[u.sigla] ?? null, fmtOutro, ctx)] as [string, string]]
                : []),
            ]
          : [];
        return [u.sigla, {
          topo: `${u.regiao} · ${pos}`,
          nome: u.nome,
          ...partes,
          apagado: !val,
          detalhes,
          link: comLink && cfg.urlProduto ? { texto: preencher(t.verProduto, { produto: p.nome }), url: preencher(cfg.urlProduto, { produto: p.id }) } : undefined,
          nota: nota(cfg, dados, chave, { produto: nomeFrase }, fontesDe(p, dados)),
        }];
      })
    ),
    fonte: htmlFontes(fontesDe(p, dados), ctx, p.nota),
  };
}
