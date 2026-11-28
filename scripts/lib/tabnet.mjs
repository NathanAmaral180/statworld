// Consulta ao TabNet do DATASUS (Ministério da Saúde): pede uma tabela já somada e devolve as linhas.
// O TabNet é um formulário antigo, em latin1. Aqui montamos o mesmo pedido que o navegador faria e lemos a resposta no formato "prn" (separada por ";").
// Uso: const t = await tabnet('sinasc/cnv/nvuf.def', { Linha: 'Unidade_da_Federação', Coluna: 'Tipo_de_parto', Incremento: 'Nascim_p/resid.mãe', Arquivos: ['nvuf24.dbf'] })
// Devolve { cabecalho: [...], linhas: [[rotulo, n1, n2...]], total: [...] }.
const latin1 = (s) => [...Buffer.from(String(s), 'latin1')].map((b) => (/[A-Za-z0-9_.*-]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : '%' + b.toString(16).toUpperCase().padStart(2, '0'))).join('');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// base: endereço do programa do TabNet (padrão: DATASUS; a ANS usa outro).
export async function tabnet(def, campos, filtros = {}, base = 'http://tabnet.datasus.gov.br/cgi/tabcgi.exe') {
  const partes = [];
  const add = (k, v) => partes.push(`${latin1(k)}=${latin1(v)}`);
  add('Linha', campos.Linha);
  add('Coluna', campos.Coluna ?? '--Não-Ativa--');
  for (const i of [].concat(campos.Incremento)) add('Incremento', i);
  for (const a of [].concat(campos.Arquivos)) add('Arquivos', a);
  for (const [k, vs] of Object.entries(filtros)) for (const v of [].concat(vs)) add(k, v);
  add('formato', 'prn'); add('mostre', 'Mostra'); add('zeradas', 'exibe');
  const corpo = partes.join('&');
  for (let t = 1; t <= 5; t++) {
    try {
      const r = await fetch(`${base}?${def}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: corpo });
      if (r.ok) {
        const html = Buffer.from(await r.arrayBuffer()).toString('latin1');
        const pre = html.match(/<PRE>([\s\S]*?)<\/PRE>/i);
        if (pre) return ler(pre[1]);
        if (/Nenhum registro selecionado|n.o h. dados/i.test(html)) return { cabecalho: [], linhas: [], total: null };
      }
    } catch { /* tenta de novo */ }
    await espera(3000 * t);
  }
  throw new Error(`O TabNet não respondeu: ${def} (${JSON.stringify(campos)})`);
}

const ENT = { aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', atilde: 'ã', otilde: 'õ', acirc: 'â', ecirc: 'ê', ocirc: 'ô', ccedil: 'ç', agrave: 'à', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Atilde: 'Ã', Ccedil: 'Ç', Ocirc: 'Ô', Ecirc: 'Ê', Acirc: 'Â', nbsp: ' ', amp: '&', ordm: 'º', ordf: 'ª' };
const decodificar = (s) => s.replace(/&(\w+);/g, (m, n) => ENT[n] ?? m).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n));

function ler(txt) {
  const linhas = decodificar(txt.replace(/<[^>]+>/g, '')).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => l.split(';').map((c) => c.replace(/^"|"$/g, '').trim()));
  const cabecalho = linhas.shift() ?? [];
  const num = (c) => (c === '-' ? 0 : c === '' || c === '...' ? null : Number(c.replace(/\./g, '').replace(',', '.')));
  const dados = linhas.map((l) => [l[0], ...l.slice(1).map(num)]);
  const total = dados.find((l) => /^Total$/i.test(l[0])) ?? null;
  return { cabecalho, linhas: dados.filter((l) => !/^Total$/i.test(l[0])), total };
}
