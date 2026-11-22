StatWorld · Mapa do site (esqueleto completo)
22 de nov. de 2026 · @Nathan
Princípios
Tudo o que vale para qualquer tema e qualquer país já está decidido aqui; o que muda de um tema para outro são só os dados.
1.  Um molde só. O Brasil é o modelo. Mapa, ranking, ficha, gráfico de série e "de onde vem cada R$ 100" funcionam para todos os temas e países.
2.  Páginas nascem de cadastro. Tema, aba, indicador e território são registros em um catálogo. Uma página nova é uma linha no cadastro mais os dados, sem desenho novo.
3.  Todo número tem fonte, data e selo de frequência (anual, mensal, diário, ao vivo). Nenhum número fica escrito dentro de uma página.
4.  "Sem dado" é um estado próprio, mostrado com hachura e nunca como zero.
5.  Três lentes em toda entidade: Dados (consolidado), Ao vivo (só o que tem fonte frequente; contador estimado leva o rótulo "estimativa") e História (texto escrito com gráficos).
6.  Classificações internacionais desde o início, para os países serem comparáveis: ISIC (indústria), FAO (agro), CID (saúde), COFOG (gasto público), ISCED (educação).
7.  Comparação entre países em paridade de poder de compra (PPC), além da moeda local.
8.  Medir pelo que é comparável: o produto que mais se produz num estado é medido em valor (R$), nunca em toneladas.
9.  Documentação como regra: cada fonte de dados tem um README em português simples; um arquivo de regras na raiz do projeto guarda estes princípios.
Publicidade e privacidade. O site se financia com anúncios e outras fontes (patrocínio de páginas com selo "patrocinado", dados e API pagos, apoio de leitores). Todo anúncio é marcado "Publicidade", tem tamanho fixo, nunca fica junto do mapa, dos gráficos ou da ficha, e nunca imita um dado ou um botão. Anunciante nenhum influencia o que o dado mostra. O site precisa de aviso de cookies e página de privacidade (LGPD) antes de exibir anúncios.
Molde de página
O caminho do leitor desce por seis níveis, e cada indicador declara em quais deles existe; fora disso a página mostra "sem dado neste nível".
1.  Início (mundo): temas, mapa-múndi, busca, "agora" e histórias.
2.  Tema: escolhe o país. Ex.: Economia.
3.  País: abas do tema, agrupadas. Ex.: Brasil · Economia.
4.  Estado ou região: a mesma estrutura de abas, com o mapa dos seus municípios.
5.  Município: ficha e rankings locais.
6.  Entidades transversais: produto (soja), empresa (Petrobras) e instituição. Aparecem em qualquer nível.
Elemento
Regra
Abas de toda entidade
Dados · Ao vivo · História
URL
/br/economia · /br/sp/economia · /br/sp/campinas/economia · /produtos/soja · /empresas/petrobras
Componentes
Mapa, ranking, ficha, gráfico de série, composição ("de onde vem cada R$ 100"), nota de método
Selos
Frequência, "estimativa", "exemplo" (só em desenho), "pendente de conferência"
Configuração por país
Moeda, idioma, nomes dos níveis (estado, província, departamento), fontes oficiais
Barra de abas
Grupos com rótulo discreto, sem quebra de linha; no celular, rolagem horizontal ou menu
Os temas
Vinte áreas em cinco grupos. As fontes são candidatas para o Brasil e todas estão a verificar: nenhuma foi conferida ainda. O Agro fica dentro de Economia, como setor.
Economia e infraestrutura
#
Tema
Subdivisões
Fontes candidatas (Brasil)
Nível mais fino provável
1
Economia
Visão geral, setores, trabalho, preços, impostos, comércio exterior, dinheiro, contas públicas (detalhe na seção seguinte)
IBGE, Banco Central, Tesouro, Comex Stat
Município
2
Empresas e mercados
Maiores empresas, por setor, bolsa, capital aberto, abertura e fechamento de empresas
CVM, B3, Receita Federal (CNPJ)
Empresa
3
Energia
Geração por fonte, consumo, preços de combustíveis, petróleo e gás, renováveis
EPE, ANEEL, ANP
Estado
4
Transporte e infraestrutura
Rodovias, ferrovias, portos, aeroportos, frota, acidentes, logística
ANTT, ANTAQ, ANAC, DNIT, Senatran
Município
Pessoas
#
Tema
Subdivisões
Fontes candidatas (Brasil)
Nível mais fino provável
5
Demografia
População, nascimentos e mortes, envelhecimento, migração, famílias, raça e cor
IBGE (Censo, estimativas)
Município
6
Saúde
Expectativa de vida, mortalidade, doenças, vacinação, leitos e profissionais, gasto em saúde
DATASUS, Ministério da Saúde, IBGE
Município
7
Educação
Alfabetização, matrículas, qualidade (Ideb, Enem), evasão, ensino superior, gasto
INEP, IBGE
Município
8
Moradia e urbanismo
Déficit habitacional, aluguel e preço de imóveis, favelas, áreas urbanas
IBGE, Fundação João Pinheiro
Município
9
Água e saneamento
Acesso à água, esgoto, coleta de lixo, perdas na distribuição
SNIS/SINISA, IBGE
Município
10
Desigualdade e inclusão
Renda por faixa, Gini, pobreza, gênero, raça, pessoas com deficiência
IBGE (PNAD), CadNúnico
Estado (município em parte)
11
Desenvolvimento humano e bem-estar
IDH, índices de felicidade e qualidade de vida
PNUD, Atlas Brasil, ONU
Município (IDH-M)
Estado e sociedade
#
Tema
Subdivisões
Fontes candidatas (Brasil)
Nível mais fino provável
12
Política e eleições
Resultados, candidatos, partidos, comparecimento, perfil do eleitorado, Congresso
TSE, Câmara, Senado
Seção eleitoral / município
13
Governo e serviços públicos
Servidores, orçamento, gasto por função, transparência, compras públicas
Portal da Transparência, Tesouro, SIAFI
Município
14
Segurança e justiça
Homicídios, roubos, prisões, polícia, processos e tempo da Justiça
Fórum Brasileiro de Segurança Pública, Sinesp, CNJ, Senappen
Município
15
Relações internacionais e defesa
Parceiros, tratados, gasto militar, missões, migração e refúgio
Itamaraty, Ministério da Defesa, SIPRI (comparativo)
País
Planeta e tecnologia
#
Tema
Subdivisões
Fontes candidatas (Brasil)
Nível mais fino provável
16
Meio ambiente e clima
Desmatamento, queimadas, emissões, áreas protegidas, clima e chuvas, biodiversidade
INPE, MapBiomas, SEEG, INMET
Município
17
Tecnologia e conectividade
Acesso à internet, celular, banda larga, comércio eletrônico, governo digital
Anatel, CETIC.br, IBGE
Município
18
Ciência e inovação
Pesquisa e desenvolvimento, patentes, bolsas, publicações, universidades
CAPES, CNPq, INPI, MCTI
Instituição
Cultura e lazer
#
Tema
Subdivisões
Fontes candidatas (Brasil)
Nível mais fino provável
19
Cultura, esporte e lazer
Equipamentos culturais, cinema, livros, patrimônio, esporte, hábitos de lazer
IBGE (Munic, PNAD), Ancine, IPHAN
Município
20
Turismo e viagens
Chegadas, gasto, hospedagem, destinos, aeroportos, balança de turismo
Ministério do Turismo, Embratur, ANAC
Município
Economia em detalhe
A barra de Economia tem 10 abas em quatro grupos. As abas não somam o PIB: faltam os impostos sobre produtos e a construção e energia, que não têm aba própria. Isso deve estar escrito no site. Fontes e frequências abaixo são candidatas e estão a verificar.
Grupo
Aba
Medidas principais
Fonte candidata
Frequência
Nível mais fino
Situação
Visão geral
Visão geral
Peso no PIB, PIB por pessoa, crescimento, impostos sobre produtos (% do PIB)
IBGE, Contas Regionais (edição 2024 já saída)
Anual
Estado (município pelo PIB dos Municípios)
Desenhada; dados a atualizar para 2024
Setores
Agro
Produto líder por estado, quanto cada estado produz de cada produto, valor da produção, rebanho; filtro lavouras e pecuária
IBGE (PAM, PPM), MAPA
Anual
Município
Desenhada
Setores
Indústria
Valor da transformação industrial, ramo líder, emprego industrial, construção e energia
IBGE (PIA), RAIS
Anual
Estado (emprego: município)
Criada
Setores
Serviços
Receita e emprego por atividade (comércio, finanças, transporte, turismo)
IBGE (PAS, PMC, PMS), RAIS
Mensal e anual
Estado (emprego: município)
Criada
Pessoas e governo
Trabalho e renda
Desemprego, renda média, informalidade, empregos com carteira criados e perdidos, Gini
IBGE (PNAD Contínua), Novo Caged, RAIS
Trimestral, mensal e anual
Estado (emprego formal: município)
A desenhar
Pessoas e governo
Preços e poder de compra
IPCA e por região, cesta básica, salário mínimo em cestas, renda real, paridade de poder de compra
IBGE, DIEESE, Banco Mundial
Mensal e anual
Capital / região
A desenhar
Pessoas e governo
Impostos
Impostos sobre produtos (% do PIB), ICMS por estado, arrecadação federal por estado, carga tributária
IBGE, Confaz, Receita Federal, Tesouro
Anual e mensal
Estado
A desenhar
Mundo e mercado
Comércio exterior
Exportações e importações por estado e produto, parceiros comerciais, balança
Comex Stat (MDIC)
Mensal
Município
A desenhar
Mundo e mercado
Dinheiro e juros
Selic, câmbio, bolsa, crédito, inadimplência
Banco Central, B3
Diário e mensal
País
A desenhar
Mundo e mercado
Contas públicas
Dívida pública, resultado primário, gasto por função
Tesouro, Banco Central
Mensal
País e estado
A desenhar
Para os outros 19 temas, a regra é a mesma: abas agrupadas, três lentes (Dados, Ao vivo, História) e uma entidade por item cadastrado. O detalhe de cada um vem quando chegar a vez dele.
Ordem de construção
Primeiro o molde funcionando com o Brasil em Economia; só depois novos temas e países. Cada etapa termina em algo que se vê no ar.
1.  Fundação (Claude Code): projeto, regras permanentes, modelo de dados, site publicado.
2.  Visão geral com dados de 2024 e a medida de impostos sobre produtos (dados conferidos pela tabela oficial do IBGE).
3.  Agro com todos os produtos (todos os que o IBGE publica, lavouras e pecuária), já puxados; falta conferir cada número contra a fonte antes de ir ao ar.
4.  Página da Soja (Dados e História; Ao vivo só com fonte de preço confiável e liberada) e a história "O agro no Brasil".
5.  Impostos, depois Trabalho e renda, depois Preços e poder de compra.
6.  Comércio exterior, Dinheiro e juros, Contas públicas.
7.  Indústria e Serviços com dados conferidos.
8.  Segundo país, para testar o molde fora do Brasil.
9.  Novos temas, na ordem sugerida: Demografia, Saúde, Educação, Política e eleições, Segurança e justiça; os demais depois.
Um tema novo custa pesquisa de fontes, conectores de dados e textos; o desenho não cresce junto, porque o molde é o mesmo.
Pendências
Nada abaixo está conferido. O que for resolvido sai da lista.
[ ] Baixar a tabela oficial das Contas Regionais 2024 (IBGE) e atualizar PIB, PIB por pessoa e crescimento; checar se os 9 estados sem dado de crescimento deixam de existir.
[ ] Conferir na tabela oficial o peso dos impostos sobre produtos por estado (números recebidos de outra conversa não foram confirmados em nenhuma fonte).
[ ] Conferir cada número de exemplo das telas do Agro, da Soja e da história "O agro no Brasil" (safra, valor da produção, exportações, texto) antes de ir ao ar.
[ ] Confirmar fonte e licença de uso de cada dado (dados abertos? exige citação?).
[ ] Achar fonte de preço de soja e de câmbio que permita uso em site e atualização frequente.
[ ] Verificar quais indicadores existem no nível de município para Indústria e Serviços.
[ ] Confirmar o ranking de empresas (posições 5 e 6 ficaram sem conferência) e os valores de SP e de 5 cidades.
[ ] Atualizar ou aposentar as páginas antigas (matéria, PIB ao vivo, PIB pela produção, mapa), que usam o estilo e os dados antigos.
[ ] Escolher o segundo país e conferir se ele publica dados no nível que o molde exige.
[ ] Definir idiomas além do português e como tratar nomes de níveis geográficos em cada país.