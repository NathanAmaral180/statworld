// Quais itens do Wikidata entram no Universo dos Fios: criações, descobertas e ideias (com ano) e as pessoas.
// Saem lugares, países, épocas, empresas, obras de arte e afins (são citados nas cronologias, mas não são "criações").
const FORA = new Set([
  'Q6256', 'Q3624078', 'Q515', 'Q1549591', 'Q486972', 'Q5119', 'Q577', 'Q578', 'Q39911', 'Q4830453', 'Q783794', 'Q891723',
  'Q43229', 'Q34770', 'Q48349', 'Q164950', 'Q839954', 'Q23397', 'Q4022', 'Q165', 'Q8502', 'Q23442', 'Q11424', 'Q7725634',
  'Q5398426', 'Q15416', 'Q1002697', 'Q41298', 'Q11032', 'Q3918', 'Q2385804', 'Q198', 'Q178561', 'Q11514315', 'Q28171280',
  'Q16334295', 'Q41710', 'Q1620908', 'Q35657', 'Q107390', 'Q3336843', 'Q15642541', 'Q17524420', 'Q1048835', 'Q82794',
  'Q1637706', 'Q3957', 'Q7930989', 'Q1093829', 'Q484170', 'Q747074', 'Q15284', 'Q2221906', 'Q1496967', 'Q17334923',
  'Q13226383', 'Q1371849', 'Q19832486', 'Q3024240', 'Q1149652',
]);
// Tirados depois do primeiro download (dinastias, províncias e cidades, instituições, laboratórios, empresas, cavernas
// e monumentos). Ficam numa lista à parte para o download dos links continuar usando a mesma lista (o cache bate).
const FORA_AO_MONTAR = new Set(['Q11876947', 'Q50068795', 'Q1615742', 'Q110071194', 'Q163740', 'Q483242', 'Q6881511', 'Q35509', 'Q4989906', 'Q1785071', 'Q7075', 'Q31855']);
// Sites e editoras que aparecem só porque os artigos os citam nas referências (não são criações do assunto).
const TITULOS_FORA = new Set(['Wayback Machine', 'Cambridge University Press', 'Oxford University Press', 'Wikisource', 'Encyclopædia Britannica', 'Hugh Chisholm', 'Internet Archive', 'JSTOR', 'Digital object identifier', 'ISBN', 'Google Books', 'Project Gutenberg', 'Wikimedia Commons', 'Wiktionary', 'Smithsonian Institution', '18th century in science', '19th century in science', '20th century in science', '21st century in science', 'Nature (journal)', 'Science (journal)', 'Philosophical Transactions of the Royal Society', 'The New York Times', 'BBC News', 'Royal Society', 'Scientific American', 'Popular Science', 'The Times', 'The Guardian', 'Time (magazine)', 'National Geographic', 'Guinness World Records', 'Technology and Culture', 'IEEE Spectrum', 'New Scientist', 'Manchester', 'London', 'Paris', 'United States', 'China', 'Ancient Egypt', 'Ancient Greece', 'Roman Empire', 'Nobel Prize', 'Nobel Prize in Physics', 'Nobel Prize in Chemistry', 'Nobel Prize in Physiology or Medicine', 'NASA', 'Yale University', 'University of Michigan', 'Springer Science+Business Media', 'YouTube', 'Harvard University', 'Massachusetts Institute of Technology', 'Stanford University', 'University of Cambridge', 'University of Oxford', 'Elsevier', 'Wiley (publisher)', 'American Physical Society']);
const PESSOA = 'Q5';

// paraBaixar: lista usada no download dos links (um pouco maior; não muda, para o cache continuar valendo).
export function escolher(ents, { paraBaixar = false } = {}) {
  return ents.filter((e) => {
    if (!e.en || !e.nome) return false;
    if (!paraBaixar && TITULOS_FORA.has(e.en)) return false;
    if (e.tipos.includes(PESSOA)) return true;
    if (e.ano == null) return false;
    return !e.tipos.some((t) => FORA.has(t) || (!paraBaixar && FORA_AO_MONTAR.has(t)));
  });
}
