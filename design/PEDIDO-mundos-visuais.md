# Pedido ao Claude Design: "mundos visuais" para Saúde e Demografia (e depois para todos os temas)

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole. Se der, anexe fotos das páginas atuais de Saúde e Demografia (https://statworld.nathanjulho180.workers.dev/saude e /demografia) e do Agro (/economia/agro).

---

O StatWorld ("Os números do mundo, explicados.") já tem Saúde e Demografia no ar, feitos a partir dos seus designs das rodadas 6 e 7. Os dados estão certos, mas **o dono não se apaixonou**: as páginas parecem relatório. Mapa em degradê, barras e linhas funcionaram bem na Economia, mas em Saúde e Demografia todos os mapas ficam parecidos e ninguém lembra do número.

**A única tela que deu o "uau" foi o mapa do Agro**: cada estado com o **ícone e a cor do produto** que mais produz. Ele funciona porque responde **o que cada lugar é**, e não só **quanto**. É essa sensação que quero em todos os temas.

Agora quero ir além: **cada tema com um mundo visual próprio**, gráfico e ilustrado, que chame atenção e dê vontade de mandar para alguém. **Liberdade total**: pode quebrar o molde atual, criar formas que nenhum site de dados tem, usar ilustração, cena, animação, rolagem que conta história. O dono escolhe depois o que entra.

## A regra de ouro: a ilustração É o dado
- Nada de enfeite solto. O desenho é feito de **coisas contáveis que vêm dos números**: cada leito desenhado é uma quantidade de leitos de verdade, cada berço é uma parte dos bebês, cada pessoa da multidão é 1 em cada 100.
- Trocar o lugar (estado ou cidade) **muda a cena**: o hospital de Roraima tem menos leitos ocupando o quarto que o de São Paulo; a rua do Maranhão tem mais crianças que a do Rio Grande do Sul.
- O fundo pode ser ilustrado (hospital, maternidade, rua, cidade), mas **discreto**: o dado na frente, legível no claro e no escuro.
- Todo número continua com **fonte, data e selo** (anual, mensal, estimativa). Número de exemplo com o selo "exemplo".

## Saúde: o mundo do hospital
Ideias (use, mude, junte ou troque por algo melhor):
1. **O hospital do seu estado**: uma fachada ou corte de hospital em que os andares são os dados: enfermaria com **leitos do SUS** e **leitos fora do SUS** por mil habitantes, a **UTI**, os **médicos** e **enfermeiros** como bonequinhos de jaleco, a ambulância na porta. Troca o estado e o prédio cresce ou encolhe.
2. **A maternidade**: um berçário com 100 berços. Quantos bebês nasceram de cesárea, de mães com até 19 anos, com baixo peso, com 7 ou mais consultas de pré-natal. Os berços se reorganizam ao trocar de lugar.
3. **"Do que cada lugar morre mais"**, como o Agro: cada estado e cada cidade com o **ícone e a cor da causa de morte que mais pesa ali acima da média do Brasil** (coração, câncer, violência e acidentes, respiratórias, infecciosas, diabetes…). Preciso dos ícones das causas.
4. **"Um dia no Brasil"**: relógio de 24 horas ou contador ao vivo. "Desde que você abriu esta página nasceram X bebês, morreram Y pessoas, Z do coração." É estimativa calculada com os números anuais oficiais (selo "estimativa").
5. **Planos de saúde**: uma fila ou sala de espera com 100 pessoas; as que têm plano numa cor.
6. **A ficha da cidade** como um "cartão de saúde" ou prontuário ilustrado, que dê vontade de compartilhar.

Dados que já temos (reais, no site): mortes por 100 mil padronizadas por idade; mortes por grupo de causas da CID-10 (contagens, 2015–2025); mortalidade infantil e materna; nascidos vivos com pré-natal, cesárea, mães até 19 anos e baixo peso; médicos, enfermeiros, leitos SUS e não SUS, UTI (mensal); % com plano de saúde (mensal); Pesquisa Nacional de Saúde (pressão alta, diabetes, fumo, obesidade, autoavaliação, com margem). Tudo por estado, e por município em SP (menos a pesquisa). Em breve: vacinação, dengue semana a semana, internações, gasto público.

## Demografia: o mundo da rua, da cidade e da multidão
1. **"100 pessoas do seu estado"**: uma multidão de 100 bonequinhos que se reorganiza: por idade, por cor ou raça, homens e mulheres, quem mora sozinho, quem nasceu em outro estado. Animação suave entre um corte e outro.
2. **"O brasileiro típico de cada estado"**: um personagem ilustrado montado com os dados (idade do meio, cor ou raça mais comum, mora em cidade ou no campo, filhos por mulher). Um mapa do Brasil feito desses personagens, como o do Agro é feito de produtos.
3. **A rua que envelhece**: uma rua ou praça desenhada em que, ao passar os anos de 1980 a 2060, as crianças diminuem e os idosos aumentam (pirâmide etária virando cena). Com ▶ para ver a evolução.
4. **Casas**: um quarteirão em que cada casa mostra quantas pessoas moram nela (domicílios de 1, 2, 3, 4+ pessoas).
5. **Migração**: setas ou "viagens" de pessoas entre estados, como rotas.
6. **"Sua vida em números"**: a pessoa diz a idade e a cidade e vê a própria geração: quantos nasceram no mesmo ano, quantos ainda vivem, a esperança de vida.

Dados que já temos: população (Censo 2022 e estimativas), crescimento, pirâmide 1980–2060, idade do meio, envelhecimento, nascimentos e mortes, esperança de vida, cor ou raça, indígenas e quilombolas, domicílios, migração. Por estado e por município de SP.

## Para todos os temas (o "sistema")
- Quero que esse jeito vire **regra do site**: cada tema com o seu mundo (Economia: o mapa do Agro, mercados, fábricas; Saúde: hospital; Demografia: rua e multidão; Infraestrutura: estradas e trilhos; depois Educação: escola). Proponha **como os mundos convivem** com a mesma identidade do StatWorld (mesma paleta base, mesma tipografia, mesmos selos), cada um com a sua cor e os seus desenhos.
- Uma **abertura forte** para cada tema: a primeira tela que a pessoa vê é a cena, não uma tabela. Mapa, ranking e ficha continuam existindo, logo abaixo, para quem quer comparar.
- Ícones novos no mesmo traço dos 81 do Design System.

## Telas que preciso (claro e escuro, desktop 1440 e celular 375)
1. Abertura da Saúde (a cena principal), Brasil.
2. O hospital do estado (ou o que você propuser no lugar), com troca de estado.
3. A maternidade / cada 100 bebês.
4. Mapa "do que cada lugar morre mais", com os ícones das causas.
5. "Um dia no Brasil" (contador).
6. Ficha de saúde de uma cidade de SP (ex.: Campinas) no novo estilo.
7. Abertura da Demografia (a cena principal).
8. "100 pessoas do seu estado" com 2 cortes diferentes.
9. "O brasileiro típico" ou a rua que envelhece.
10. Uma página que mostre o sistema: os mundos lado a lado (Economia, Saúde, Demografia, Infraestrutura, Educação).

## Restrições
- Leve no celular: nada de imagens pesadas; de preferência SVG e CSS, animação que pode ser desligada (respeitar "reduzir movimento").
- Nada exclusivo do Brasil: textos, cenas e cortes vêm de configuração.
- Ilustração com pessoas: diversidade real, sem estereótipos.
- "Sem dado" é um estado próprio (hachura), nunca zero.
- Anúncio nunca junto da cena, do mapa, da ficha ou dos gráficos.
- Acessível: cada cena tem o texto do que ela mostra para leitor de tela.

---

Quando receber, coloque os arquivos numa pasta nova `design/rodada-10-mundos/` e avise o Claude.
