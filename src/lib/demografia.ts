// Tema Demografia: junta os indicadores por estado dos três arquivos de dados (população, Censo e séries)
// (usado por src/lib/demografia-design.ts, que monta os dados das telas do design).
import { carregarDados } from './dados';


export function arquivosDemografia(pais: any) {
  const a = pais.arquivos.demografia;
  const ler = (nome?: string) => { if (!nome) return null; try { return carregarDados<any>('demografia', nome); } catch { return null; } };
  return { pop: ler(a.estado), censo: ler(a.censo), series: ler(a.series) };
}

