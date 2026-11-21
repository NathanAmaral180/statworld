// Lê os arquivos da pasta dados/ e de src/config/textos/.
// As páginas pedem o arquivo pelo nome; nenhum número fica escrito nas páginas.

const arquivosDados = import.meta.glob('../../dados/**/*.json', { eager: true, import: 'default' });
const arquivosTextos = import.meta.glob('../config/textos/*.json', { eager: true, import: 'default' });

export function carregarDados<T = any>(grupo: string, nome: string): T {
  const chave = `../../dados/${grupo}/${nome}.json`;
  const arq = arquivosDados[chave];
  if (!arq) throw new Error(`Arquivo de dados não encontrado: dados/${grupo}/${nome}.json`);
  return arq as T;
}

export function carregarTextos(idioma: string): Record<string, string> {
  const arq = arquivosTextos[`../config/textos/${idioma}.json`];
  if (!arq) throw new Error(`Textos não encontrados para o idioma ${idioma} (src/config/textos/${idioma}.json)`);
  return arq as Record<string, string>;
}
