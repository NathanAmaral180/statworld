# Pedido ao Claude Design: tema Saúde (Brasil, estados e municípios)

Antes de colar, escolha no Claude Design o Design System **StatWorld** (https://claude.ai/artifact/YMjJ44DR6MjzvcKEkBqvwD). Depois copie o texto abaixo e cole.

---

O StatWorld ("Os números do mundo, explicados.") já tem no ar os temas **Economia** e **Demografia**: Brasil por estado e São Paulo por município (mapa dos municípios em cinzas, com o destaque na cor da bandeira do estado). Na Demografia você criou formas próprias e elas funcionaram muito bem: população ao vivo com selo de estimativa, pirâmide com ▶, halteres, cada 100 pessoas e barras 100%. Agora vem o tema **Saúde**.

Use o Design System **StatWorld** (tokens, componentes, ícones, tema claro e escuro). Mantenha o que já existe: cabeçalho, abas em dois níveis, ficha, selos (Censo, Anual, Mensal, Estimativa, Projeção), carimbo "fonte · data" e "sem dado" com hachura.

**Use a criatividade:** proponha a melhor forma para cada assunto, mesmo que o site ainda não tenha nada parecido. O dono escolhe depois o que entra.

## O que existe de dado (fontes oficiais; números ainda a conferir)
A maior parte vem do **Ministério da Saúde (DATASUS)** e existe **por município**:
- **De que se morre:** óbitos por causa, pela classificação internacional **CID-10** (doenças do coração, câncer, causas externas como acidentes e violência, doenças respiratórias…), por idade e sexo, de 1996 até o último ano (SIM). Também a mortalidade infantil e a mortalidade materna.
- **Nascer:** nascidos vivos, pré-natal (7 ou mais consultas), partos cesáreos, mães adolescentes, baixo peso ao nascer (SINASC).
- **Vacinação:** cobertura de cada vacina por ano, comparada com a meta (SI-PNI).
- **Onde se trata:** hospitais, leitos (SUS e não SUS, UTI), médicos, enfermeiros e outros profissionais por habitante (CNES, mensal).
- **Atendimentos:** internações e procedimentos no SUS (SIH e SIA).
- **Doenças acompanhadas:** dengue, tuberculose, aids e outras de notificação (SINAN), em alguns casos por semana.
- **Quanto se gasta:** gasto público em saúde por habitante, por estado e município (SIOPS); a classificação internacional **COFOG**, que o site já usa nas Contas públicas.
- **Planos de saúde:** beneficiários por município (ANS).
- **Como as pessoas dizem que estão:** saúde autoavaliada, doenças crônicas, hábitos (IBGE, Pesquisa Nacional de Saúde; só Brasil e estados).
- **Esperança de vida:** já está na Demografia; pode ser só um link.

## Ideias (pode mudar tudo)
- "De que se morre em cada lugar", comparado ao Brasil, por idade e sexo.
- As causas de morte ao longo do tempo (ex.: a pandemia de 2020–2021, a queda da mortalidade infantil).
- Vacinação como "quanto falta para a meta", por vacina.
- "Quantos médicos para cada mil pessoas" e "quanto tempo até o hospital mais perto".
- Dengue ou outras doenças semana a semana, com o selo **"Semanal"** ou **"Ao vivo"** só quando a fonte for frequente.
- Ficha do município com os números de saúde comparados ao estado e ao país.

## Cuidados obrigatórios
- **Linguagem neutra e respeitosa.** É assunto sensível: nada de alarme, adjetivos ou ranking de "pior cidade para morrer". Os números falam sozinhos, com a explicação do que medem.
- **Taxas, não só totais.** Comparar lugares por habitante, ou padronizado por idade quando a fonte permitir. Uma cidade com mais idosos tem mais mortes sem ser "pior".
- **Números pequenos variam muito.** Em municípios pequenos, mostre quando o número é pequeno demais para comparar (ex.: média de vários anos ou um aviso).
- **Dados de registro atrasam:** o ano mais recente pode estar incompleto. Precisa de um selo ou aviso para "dado preliminar".
- Nenhum anúncio perto de mapa, ficha ou gráfico. Nada de imagens chocantes.

## Níveis
- **Brasil por estado** e **estado por município**, no mesmo molde das rodadas 5 e 6 (busca, filtro por região, ranking longo).
- Proponha as **abas** do tema, em grupos, e o que cada uma mostra em cada nível. Use as situações já existentes quando o dado não existir no nível: "só o número do estado", "sem dado neste nível" ou "em breve".

## Telas que preciso (claro e escuro, desktop 1440 e celular 375)
1. Visão geral de Saúde do Brasil.
2. Uma tela de cada aba que você propuser, com a melhor forma para aquele dado.
3. Saúde de São Paulo por município (Visão geral) e uma aba com uma forma que não seja mapa.
4. A ficha de um município com os números de Saúde.

## Restrições
- Nada exclusivo do Brasil nem de São Paulo: nomes, níveis, cores e textos vêm de configuração.
- Nada de números inventados: textos de exemplo marcados ("00,0") com o selo "exemplo".
- Todo número com fonte, data e selo de frequência. "Sem dado" com hachura, nunca zero.
- Funcionar com teclado e leitor de tela. No celular, textos curtos.
- Nada de faixas "… hoje" no topo das abas.

---

Quando receber, coloque os arquivos numa pasta nova `design/rodada-7-saude/` e avise o Claude.
