// Baixa do USDA (Departamento de Agricultura dos EUA, serviço ERS) quanto cada estado recebeu
// pela venda de cada produto agropecuário ("cash receipts").
// Gera: dados/agro/eua-estados.json
// Como rodar (na pasta statworld):  node scripts/eua-agro-estados/baixar.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const XLSX = createRequire(import.meta.url)('xlsx'); // usado aqui só para abrir o .zip

// ---- O que muda a cada atualização (confira no LEIA-ME) --------------------
const ANO = 2025;
const URL_ZIP = 'https://www.ers.usda.gov/media/29517/september-3-2026-release.zip';
// ----------------------------------------------------------------------------

const URL_PAGINA = 'https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/data-files-us-and-state-level-farm-income-and-wealth-statistics';
const SAIDA = new URL('../../dados/agro/eua-estados.json', import.meta.url);
const SIGLAS = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');

// Produto do USDA -> [identificador no site, nome em português, grupo].
// Os identificadores iguais aos do Brasil reaproveitam ícone e cor (ex.: soja, milho, frango).
const L = 'lavouras', P = 'pecuaria';
const PRODUTOS = {
  'Almonds': ['amendoa', 'Amêndoa', L], 'Apples': ['maca', 'Maçã', L], 'Apricots': ['damasco', 'Damasco', L],
  'Aquaculture': ['aquicultura', 'Aquicultura', P], 'Artichokes': ['alcachofra', 'Alcachofra', L], 'Asparagus': ['aspargo', 'Aspargo', L],
  'Avocados': ['abacate', 'Abacate', L], 'Barley': ['cevada', 'Cevada', L], 'Beans, snap': ['vagem', 'Vagem', L],
  'Beets': ['beterraba', 'Beterraba', L], 'Blueberries': ['mirtilo', 'Mirtilo', L], 'Broccoli': ['brocolis', 'Brócolis', L],
  'Broilers': ['frango', 'Frango', P], 'Cabbage': ['repolho', 'Repolho', L], 'Cane for sugar': ['cana-de-acucar', 'Cana-de-açúcar', L],
  'Canola': ['canola', 'Canola', L], 'Cantaloups': ['melao', 'Melão-cantalupo', L], 'Carrots': ['cenoura', 'Cenoura', L],
  'Cattle and calves': ['bovinos', 'Bovinos', P], 'Cauliflower': ['couve-flor', 'Couve-flor', L], 'Celery': ['aipo', 'Aipo', L],
  'Cherries': ['cereja', 'Cereja', L], 'Chicken eggs': ['ovos', 'Ovos', P], 'Coffee': ['cafe', 'Café', L],
  'Corn': ['milho', 'Milho', L], 'Cotton': ['algodao', 'Algodão', L], 'Cranberries': ['cranberry', 'Cranberry', L],
  'Cucumbers': ['pepino', 'Pepino', L], 'Dairy products': ['leite', 'Leite e derivados', P], 'Dates': ['tamara', 'Tâmara', L],
  'Dry beans': ['feijao', 'Feijão', L], 'Dry peas': ['ervilha-seca', 'Ervilha seca', L], 'Farm chickens': ['galinhas', 'Galinhas', P],
  'Flaxseed': ['linhaca', 'Linhaça', L], 'Forest products': ['produtos-florestais', 'Produtos florestais', L], 'Garlic': ['alho', 'Alho', L],
  'Grapefruit': ['toranja', 'Toranja', L], 'Grapes': ['uva', 'Uva', L], 'Greens': ['verduras', 'Verduras', L],
  'Hay': ['feno', 'Feno', L], 'Hazelnuts': ['avela', 'Avelã', L], 'Hogs': ['suinos', 'Suínos', P],
  'Honey': ['mel', 'Mel', P], 'Honeydews': ['melao-honeydew', 'Melão honeydew', L], 'Hops': ['lupulo', 'Lúpulo', L],
  'Kiwifruit': ['kiwi', 'Kiwi', L], 'Lemons': ['limao', 'Limão', L], 'Lentils (Beans)': ['lentilha', 'Lentilha', L],
  'Lettuce': ['alface', 'Alface', L], 'Macadamia nuts': ['macadamia', 'Macadâmia', L], 'Maple products': ['xarope-de-bordo', 'Xarope de bordo', L],
  'Mint': ['menta', 'Menta', L], 'Mohair': ['mohair', 'Mohair', P], 'Mushrooms': ['cogumelo', 'Cogumelo', L],
  'Mustardseed': ['mostarda', 'Mostarda', L], 'Nectarines': ['nectarina', 'Nectarina', L], 'Oats': ['aveia', 'Aveia', L],
  'Olives': ['azeitona', 'Azeitona', L], 'Onions': ['cebola', 'Cebola', L], 'Oranges': ['laranja', 'Laranja', L],
  'Papayas': ['mamao', 'Mamão', L], 'Peaches': ['pessego', 'Pêssego', L], 'Peanuts': ['amendoim', 'Amendoim', L],
  'Pears': ['pera', 'Pera', L], 'Peas, green': ['ervilha', 'Ervilha', L], 'Pecans': ['peca', 'Noz-pecã', L],
  'Peppers, chile': ['pimenta', 'Pimenta', L], 'Pistachios': ['pistache', 'Pistache', L], 'Plums and prunes': ['ameixa', 'Ameixa', L],
  'Potatoes': ['batata-inglesa', 'Batata', L], 'Proso millet': ['milheto', 'Milheto', L], 'Pumpkins': ['abobora', 'Abóbora', L],
  'Rapeseed': ['colza', 'Colza', L], 'Raspberries': ['framboesa', 'Framboesa', L], 'Rice': ['arroz', 'Arroz', L],
  'Rye': ['centeio', 'Centeio', L], 'Safflower': ['cartamo', 'Cártamo', L], 'Sorghum grain': ['sorgo', 'Sorgo', L],
  'Soybeans': ['soja', 'Soja', L], 'Spinach': ['espinafre', 'Espinafre', L], 'Squash': ['abobrinha', 'Abobrinha', L],
  'Strawberries': ['morango', 'Morango', L], 'Sugar beets': ['beterraba-acucareira', 'Beterraba-açucareira', L],
  'Sunflower': ['girassol', 'Girassol', L], 'Sweet potatoes': ['batata-doce', 'Batata-doce', L], 'Tangerines': ['tangerina', 'Tangerina', L],
  'Tobacco': ['fumo', 'Fumo', L], 'Tomatoes': ['tomate', 'Tomate', L], 'Turkeys': ['perus', 'Perus', P],
  'Walnuts': ['noz', 'Noz', L], 'Watermelons': ['melancia', 'Melancia', L], 'Wheat': ['trigo', 'Trigo', L],
  'Wool': ['la', 'Lã', P],
};
// Itens que entram com uma parte específica (o USDA não traz o "All" deles).
const PARTES = { 'Greenhouse/Nursery|Floriculture': ['flores', 'Flores e plantas ornamentais', L] };
// Somas de grupos e subdivisões: ficam de fora para não contar duas vezes.
const SOMAS = new Set(['All Commodities', 'Crops', 'Animals and products', 'Feed crops', 'Food grains', 'Fruits/Nuts', 'Meat animals',
  'Oil crops', 'Poultry/Eggs', 'Vegetables and melons', 'All other crops', 'Cotton lint', 'Cottonseed', 'Greenhouse/Nursery']);

function campos(l) {
  const o = []; let a = ''; let q = false;
  for (const c of l) { if (c === '"') q = !q; else if (c === ',' && !q) { o.push(a); a = ''; } else a += c; }
  o.push(a);
  return o;
}

const r = await fetch(URL_ZIP, { headers: { 'User-Agent': 'Mozilla/5.0 (StatWorld)' } });
if (!r.ok) throw new Error(`O USDA respondeu com erro ${r.status}. Confira o link do arquivo no LEIA-ME.`);
const zip = XLSX.CFB.read(Buffer.from(await r.arrayBuffer()), { type: 'buffer' });
const arq = zip.FileIndex.find((f) => f.name.toLowerCase().endsWith('.csv'));
if (!arq) throw new Error('Não achei o arquivo .csv dentro do zip do USDA');
const linhas = Buffer.from(arq.content).toString('latin1').split(/\r?\n/);
const cab = campos(linhas[0]);
const col = (n) => { const i = cab.indexOf(n); if (i < 0) throw new Error(`Coluna "${n}" sumiu do arquivo do USDA`); return i; };
const [cAno, cUF, cDesc, cP1, cP2, cValor, cUnid, cData] = ['Year', 'State', 'VariableDescriptionTotal', 'VariableDescriptionPart1', 'VariableDescriptionPart2', 'Amount', 'unit_desc', 'PublicationDate'].map(col);

const vazio = () => Object.fromEntries(SIGLAS.map((s) => [s, null]));
const produtos = new Map();
const totais = { tudo: vazio(), lavouras: vazio(), pecuaria: vazio() };
const desconhecidos = new Set();
let dataPub = null;

for (const l of linhas.slice(1)) {
  if (!l) continue;
  const c = campos(l);
  if (c[cAno] !== String(ANO) || !c[cDesc].startsWith('Cash receipts value') || !SIGLAS.includes(c[cUF])) continue;
  if (!c[cUnid].startsWith('$1,000')) throw new Error(`Unidade inesperada: ${c[cUnid]}`);
  dataPub ??= c[cData];
  const v = Number(c[cValor]);
  const valor = Number.isFinite(v) && c[cValor] !== '' ? v * 1000 : null; // mil US$ -> US$
  const p1 = c[cP1].trim(), p2 = c[cP2].trim(), uf = c[cUF];
  if (p2 === 'All' && p1 === 'All Commodities') { totais.tudo[uf] = valor; continue; }
  if (p2 === 'All' && p1 === 'Crops') { totais.lavouras[uf] = valor; continue; }
  if (p2 === 'All' && p1 === 'Animals and products') { totais.pecuaria[uf] = valor; continue; }
  const def = PARTES[`${p1}|${p2}`] ?? (p2 === 'All' && !SOMAS.has(p1) ? PRODUTOS[p1] : undefined);
  if (!def) { if (p2 === 'All' && !SOMAS.has(p1)) desconhecidos.add(p1); continue; }
  const [id, nome, grupo] = def;
  if (!produtos.has(id)) produtos.set(id, { id, nome, grupo, unidadeQuantidade: null, valores: vazio(), quantidades: vazio() });
  produtos.get(id).valores[uf] = valor;
}
if (desconhecidos.size) throw new Error(`Produtos novos no USDA, sem nome em português: ${[...desconhecidos].join(', ')}. Peça ajuda ao Claude.`);
const comTotal = Object.values(totais.tudo).filter((v) => v !== null).length;
if (comTotal < 50) throw new Error(`Esperava 50 estados com total, achei ${comTotal}`);

// Quando um estado não aparece para um produto, o USDA pode não ter venda OU ter escondido o número
// (sigilo). Como não dá para saber qual dos dois, fica "sem dado" (null), nunca zero.
const soma = (o) => Object.values(o).reduce((s, v) => s + (v ?? 0), 0);
const lista = [...produtos.values()]
  .map((p) => ({ ...p, valorPais: soma(p.valores), quantidadePais: null }))
  .filter((p) => p.valorPais > 0)
  .sort((a, b) => b.valorPais - a.valorPais);

const m = dataPub?.match(/([A-Za-z]+ \d+, \d{4})/);
const dataDivulgacao = m ? new Date(m[1] + ' 12:00 UTC').toISOString().slice(0, 10) : undefined;

await mkdir(new URL('.', SAIDA), { recursive: true });
await writeFile(SAIDA, JSON.stringify({
  _explicacao: 'Agro dos EUA por estado e produto: receita da venda (cash receipts), em US$. Gerado por scripts/eua-agro-estados/baixar.mjs. Não edite à mão. null = sem dado (o USDA não informa).',
  pais: 'US',
  nivel: 'estado',
  periodo: String(ANO),
  baixadoEm: new Date().toISOString().slice(0, 10),
  fontes: [{
    nome: 'USDA (EUA)',
    publicacao: `Farm Income and Wealth Statistics, cash receipts ${ANO}`,
    url: URL_PAGINA,
    dataDivulgacao,
  }],
  totais,
  produtos: lista,
}));
console.log(`Pronto: ${lista.length} produtos em ${comTotal} estados (${ANO}, USDA de ${dataDivulgacao}) salvos em dados/agro/eua-estados.json`);
console.log('Maiores:', lista.slice(0, 6).map((p) => `${p.nome} US$ ${(p.valorPais / 1e9).toFixed(1)} bi`).join('; '));
