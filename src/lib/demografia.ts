// Tema Demografia: junta os indicadores por estado dos três arquivos de dados (população, Censo e séries)
// e calcula, a partir das séries, os números do mapa de cada aba (nascimentos e mortes, esperança de vida, migração).
import { carregarDados } from './dados';

const r1 = (v: number | null) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10);
const r2 = (v: number | null) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 100) / 100);

export function arquivosDemografia(pais: any) {
  const a = pais.arquivos.demografia;
  const ler = (nome?: string) => { if (!nome) return null; try { return carregarDados<any>('demografia', nome); } catch { return null; } };
  return { pop: ler(a.estado), censo: ler(a.censo), series: ler(a.series) };
}

// Ano de referência das projeções: o ano corrente (o IBGE projeta ano a ano até 2070).
export const anoAtual = () => String(new Date().getFullYear());

export function indicadoresDemografia(pais: any) {
  const { pop, censo, series } = arquivosDemografia(pais);
  const ind: Record<string, any> = { ...(pop?.indicadores ?? {}), ...(censo?.indicadores ?? {}) };
  if (!series) return ind;
  const lugares = Object.keys(series.projecao.valores);
  const v = (f: (l: string) => number | null) => Object.fromEntries(lugares.map((l) => [l, f(l)]));
  const ano = anoAtual();
  const fp = series.fontes.projecao, rc = series.registroCivil, fn = series.fontes.nascimentos, fo = series.fontes.obitos, fm = series.fontes.migracao;
  const P = (l: string, a: string | number) => series.projecao.valores[l]?.[a] ?? null;
  ind['esperanca-vida'] = { nome: `Esperança de vida ao nascer (${ano})`, unidade: 'anos', periodo: ano, frequencia: 'projecao', fontes: [fp], calculo: 'Projeção do IBGE para o ano (não é medição).', valores: v((l) => P(l, ano)?.e0 ?? null) };
  ind['esperanca-diferenca'] = { nome: `Mulheres vivem a mais que homens (${ano})`, unidade: 'anos', periodo: ano, frequencia: 'projecao', fontes: [fp], calculo: 'Cálculo do StatWorld: esperança de vida das mulheres − dos homens, na projeção do IBGE.', valores: v((l) => { const p = P(l, ano); return p ? r1(p.e0Mulheres - p.e0Homens) : null; }) };
  ind['filhos-por-mulher'] = { nome: `Filhos por mulher (${ano})`, unidade: 'filhos', periodo: ano, frequencia: 'projecao', fontes: [fp], calculo: 'Taxa de fecundidade total projetada pelo IBGE.', valores: v((l) => P(l, ano)?.filhosPorMulher ?? null) };
  const u = rc.ultimoAno;
  ind['nascimentos'] = { nome: `Nascidos vivos registrados (${u})`, unidade: 'pessoas', periodo: u, frequencia: 'anual', fontes: [fn], calculo: rc.nota, valores: v((l) => rc.nascimentos[l]?.[u] ?? null) };
  ind['obitos'] = { nome: `Óbitos (${u})`, unidade: 'pessoas', periodo: u, frequencia: 'anual', fontes: [fo], calculo: rc.nota, valores: v((l) => rc.obitos[l]?.[u] ?? null) };
  ind['nascimentos-por-obito'] = { nome: `Nascimentos para cada morte (${u})`, unidade: 'razão', periodo: u, frequencia: 'anual', fontes: [fn, fo], calculo: 'Cálculo do StatWorld: nascidos vivos registrados ÷ óbitos do ano (Registro Civil). Abaixo de 1, morre mais gente do que nasce.', valores: v((l) => { const n = rc.nascimentos[l]?.[u], o = rc.obitos[l]?.[u]; return n != null && o ? r2(n / o) : null; }) };
  // Ano em que, na projeção do IBGE, as mortes passam os nascimentos (null se não acontece até 2070).
  ind['ano-cruzamento'] = { nome: 'Ano em que as mortes passam os nascimentos (projeção)', unidade: 'ano', periodo: '2000–2070', frequencia: 'projecao', fontes: [fp], calculo: 'Primeiro ano da projeção do IBGE com mais óbitos que nascimentos.', valores: v((l) => { const anos = Object.keys(series.projecao.valores[l] ?? {}).map(Number).sort((a, b) => a - b); const x = anos.find((a) => P(l, a).obitos > P(l, a).nascimentos); return x ?? null; }) };
  const M = series.migracao.valores;
  ind['nascidos-outro-estado'] = { nome: 'Moradores nascidos em outro estado (%)', unidade: '%', periodo: '2022', frequencia: 'censo', fontes: [fm], calculo: 'Cálculo do StatWorld: moradores nascidos em outro estado ÷ moradores (Censo 2022).', valores: Object.fromEntries(Object.entries(M).filter(([l]) => l !== 'BR').map(([l, m]: [string, any]) => [l, m.total ? r1((m.outroEstado / m.total) * 100) : null])) };
  ind['saiu-do-estado'] = { nome: 'Nascidos no estado que moram em outro', unidade: 'pessoas', periodo: '2022', frequencia: 'censo', fontes: [fm], calculo: 'Cálculo do StatWorld: soma, em todos os outros estados, dos moradores nascidos neste estado (Censo 2022).', valores: Object.fromEntries(Object.entries(M).filter(([l]) => l !== 'BR').map(([l, m]: [string, any]) => [l, m.saiu ?? null])) };
  ind['saldo-migracao'] = { nome: 'Saldo: chegaram − saíram', unidade: 'pessoas', periodo: '2022', frequencia: 'censo', fontes: [fm], calculo: 'Cálculo do StatWorld: moradores nascidos em outro estado − nascidos no estado que moram em outro (Censo 2022). Mede quem mora onde, não quando se mudou.', valores: Object.fromEntries(Object.entries(M).filter(([l]) => l !== 'BR').map(([l, m]: [string, any]) => [l, m.saiu != null ? m.outroEstado - m.saiu : null])) };
  return ind;
}
