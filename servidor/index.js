// Programa do servidor do StatWorld (roda na Cloudflare, antes dos arquivos do site).
// Só cuida de três endereços; todo o resto é o site normal (pasta dist/):
//   POST /api/visita        → anota uma visita, de forma anônima (o script fica em src/layouts/Base.astro)
//   /admin                  → painel do administrador, só com usuário e senha
//   GET  /api/admin/numeros → números do painel, só com usuário e senha
//
// Privacidade (ver /privacidade): sem cookies; não guarda endereço de internet (IP) nem dados de quem visita.
// Para contar "pessoas diferentes no dia", junta IP + navegador + um sal que muda todo dia e guarda só um
// resumo embaralhado (hash) de 16 letras. No dia seguinte o sal é trocado e apagado: não dá para voltar
// ao IP nem ligar a mesma pessoa entre dias.
//
// Configuração na Cloudflare (ver servidor/LEIA-ME.md):
//   banco D1 ligado com o nome VISITAS (wrangler.jsonc);
//   segredo SENHA_ADMIN (a senha do /admin, criada pelo dono no painel da Cloudflare).

const USUARIO = 'admin';
// Quanto tempo as visitas ficam guardadas (dias). Depois disso são apagadas.
const GUARDAR_DIAS = 400;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const caminho = url.pathname;

    if (caminho === '/api/visita') {
      if (request.method !== 'POST') return new Response(null, { status: 405 });
      try { await anotarVisita(request, env); } catch (e) { console.error('visita', e); }
      return new Response(null, { status: 204 });
    }

    if (caminho === '/admin' || caminho.startsWith('/admin/') || caminho.startsWith('/api/admin')) {
      const barrado = conferirSenha(request, env);
      if (barrado) return barrado;
      if (caminho === '/api/admin/numeros') {
        const dias = Math.min(365, Math.max(1, Number(url.searchParams.get('dias')) || 30));
        return Response.json(await numeros(env, dias), { headers: { 'cache-control': 'no-store' } });
      }
      const resposta = await env.ASSETS.fetch(request);
      const r = new Response(resposta.body, resposta);
      r.headers.set('cache-control', 'no-store');
      r.headers.set('x-robots-tag', 'noindex, nofollow');
      return r;
    }

    return env.ASSETS.fetch(request);
  },
};

// ---------- Senha ----------
function conferirSenha(request, env) {
  const pedir = (texto) => new Response(texto, {
    status: 401,
    headers: { 'www-authenticate': 'Basic realm="StatWorld admin", charset="UTF-8"', 'cache-control': 'no-store' },
  });
  if (!env.SENHA_ADMIN) return new Response('O painel ainda não tem senha. Crie o segredo SENHA_ADMIN na Cloudflare (ver servidor/LEIA-ME.md).', { status: 503 });
  const cab = request.headers.get('authorization') || '';
  if (!cab.startsWith('Basic ')) return pedir('Entre com usuário e senha.');
  let texto = '';
  try { texto = new TextDecoder().decode(Uint8Array.from(atob(cab.slice(6)), (c) => c.charCodeAt(0))); } catch { return pedir('Usuário ou senha errados.'); }
  const i = texto.indexOf(':');
  const ok = iguais(texto.slice(0, i), USUARIO) & iguais(texto.slice(i + 1), env.SENHA_ADMIN);
  return ok ? null : pedir('Usuário ou senha errados.');
}
// Compara sem "vazar" pelo tempo de resposta quantas letras estão certas.
function iguais(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let dif = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) dif |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return dif === 0 ? 1 : 0;
}

// ---------- Banco ----------
let tabelasProntas = false;
async function prepararBanco(env) {
  if (tabelasProntas) return;
  await env.VISITAS.batch([
    env.VISITAS.prepare(`CREATE TABLE IF NOT EXISTS visitas (
      id TEXT PRIMARY KEY, dia TEXT NOT NULL, hora INTEGER, caminho TEXT, pais TEXT, aparelho TEXT,
      origem TEXT, visitante TEXT, segundos INTEGER)`),
    env.VISITAS.prepare('CREATE INDEX IF NOT EXISTS visitas_dia ON visitas (dia)'),
    env.VISITAS.prepare('CREATE TABLE IF NOT EXISTS sal (dia TEXT PRIMARY KEY, valor TEXT NOT NULL)'),
  ]);
  tabelasProntas = true;
}

const hojeUTC = () => new Date().toISOString().slice(0, 10);

async function salDoDia(env, dia) {
  const achado = await env.VISITAS.prepare('SELECT valor FROM sal WHERE dia = ?').bind(dia).first('valor');
  if (achado) return achado;
  const novo = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  await env.VISITAS.batch([
    env.VISITAS.prepare('INSERT OR IGNORE INTO sal (dia, valor) VALUES (?, ?)').bind(dia, novo),
    // Sal de dias anteriores é apagado: o resumo de ontem não pode mais ser refeito.
    env.VISITAS.prepare('DELETE FROM sal WHERE dia < ?').bind(dia),
    env.VISITAS.prepare('DELETE FROM visitas WHERE dia < ?').bind(new Date(Date.now() - GUARDAR_DIAS * 864e5).toISOString().slice(0, 10)),
  ]);
  return (await env.VISITAS.prepare('SELECT valor FROM sal WHERE dia = ?').bind(dia).first('valor')) ?? novo;
}

async function resumo(texto) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Robôs (Google, ferramentas de teste) não contam como visita. A maioria nem roda o script; estes são os que rodam.
const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|pingdom/i;

// ---------- Anotar visita ----------
async function anotarVisita(request, env) {
  if (!env.VISITAS) return;
  const ua = request.headers.get('user-agent') || '';
  if (ROBO.test(ua)) return;
  const corpo = await request.json().catch(() => null);
  if (!corpo || typeof corpo.id !== 'string' || !/^[a-z0-9]{8,32}$/.test(corpo.id)) return;
  await prepararBanco(env);

  // Ao sair da página, o navegador manda só o tempo que a pessoa ficou nela.
  if (corpo.tipo === 'tempo') {
    const s = Math.round(Number(corpo.segundos));
    if (!(s >= 0)) return;
    await env.VISITAS.prepare('UPDATE visitas SET segundos = ? WHERE id = ? AND dia >= ?')
      .bind(Math.min(s, 1800), corpo.id, new Date(Date.now() - 864e5).toISOString().slice(0, 10)).run();
    return;
  }

  const caminho = typeof corpo.caminho === 'string' ? corpo.caminho.slice(0, 200).replace(/\/+$/, '') || '/' : '/';
  if (caminho.startsWith('/admin')) return;
  const dia = hojeUTC();
  const ip = request.headers.get('cf-connecting-ip') || '';
  const visitante = await resumo(`${await salDoDia(env, dia)}|${ip}|${ua}`);
  const pais = request.cf?.country && request.cf.country !== 'XX' ? request.cf.country : null;
  const aparelho = /Mobi|Android|iPhone/i.test(ua) ? 'celular' : /iPad|Tablet/i.test(ua) ? 'tablet' : 'computador';
  const origem = deOndeVeio(corpo.origem, new URL(request.url).host);
  await env.VISITAS.prepare('INSERT OR IGNORE INTO visitas (id, dia, hora, caminho, pais, aparelho, origem, visitante, segundos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)')
    .bind(corpo.id, dia, new Date().getUTCHours(), caminho, pais, aparelho, origem, visitante).run();
}

// Guarda só o nome do site de onde a pessoa veio (ex.: "google"), nunca o endereço completo.
function deOndeVeio(ref, meuHost) {
  if (typeof ref !== 'string' || !ref) return 'direto';
  let host;
  try { host = new URL(ref).hostname.replace(/^www\.|^m\.|^l\./, ''); } catch { return 'direto'; }
  if (host === meuHost) return 'interno';
  const conhecidos = { google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', yahoo: 'Yahoo', whatsapp: 'WhatsApp', wa: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram', t: 'X (Twitter)', x: 'X (Twitter)', twitter: 'X (Twitter)', linkedin: 'LinkedIn', reddit: 'Reddit', youtube: 'YouTube', tiktok: 'TikTok', telegram: 'Telegram', chatgpt: 'ChatGPT', claude: 'Claude' };
  const base = host.split('.').slice(-3).find((p) => conhecidos[p]);
  return base ? conhecidos[base] : host.slice(0, 60);
}

// ---------- Números do painel ----------
async function numeros(env, dias) {
  if (!env.VISITAS) return { semBanco: true };
  await prepararBanco(env);
  const desde = new Date(Date.now() - (dias - 1) * 864e5).toISOString().slice(0, 10);
  const q = (sql) => env.VISITAS.prepare(sql).bind(desde).all().then((r) => r.results);
  const [total] = await q(`SELECT COUNT(*) AS paginas, COUNT(DISTINCT dia || visitante) AS visitantes,
      ROUND(AVG(CASE WHEN segundos BETWEEN 1 AND 1800 THEN segundos END)) AS tempoMedio FROM visitas WHERE dia >= ?`);
  const [porDia, paises, caminhos, aparelhos, origens, horas] = await Promise.all([
    q('SELECT dia, COUNT(*) AS paginas, COUNT(DISTINCT visitante) AS visitantes FROM visitas WHERE dia >= ? GROUP BY dia ORDER BY dia'),
    q('SELECT pais, COUNT(DISTINCT dia || visitante) AS visitantes, COUNT(*) AS paginas FROM visitas WHERE dia >= ? GROUP BY pais ORDER BY visitantes DESC LIMIT 30'),
    q(`SELECT caminho, COUNT(*) AS paginas, ROUND(AVG(CASE WHEN segundos BETWEEN 1 AND 1800 THEN segundos END)) AS tempoMedio
       FROM visitas WHERE dia >= ? GROUP BY caminho ORDER BY paginas DESC LIMIT 200`),
    q('SELECT aparelho, COUNT(DISTINCT dia || visitante) AS visitantes FROM visitas WHERE dia >= ? GROUP BY aparelho ORDER BY visitantes DESC'),
    q(`SELECT origem, COUNT(*) AS paginas FROM visitas WHERE dia >= ? AND origem <> 'interno' GROUP BY origem ORDER BY paginas DESC LIMIT 15`),
    q('SELECT hora, COUNT(*) AS paginas FROM visitas WHERE dia >= ? GROUP BY hora ORDER BY hora'),
  ]);
  return { dias, desde, ate: hojeUTC(), total, porDia, paises, caminhos, aparelhos, origens, horas };
}
