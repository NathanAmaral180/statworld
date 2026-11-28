# Rodada 7: Saúde (Claude Design)

- Arquivo original: `StatWorld Saúde telas (offline).html` (abrir no navegador).
- Diferente da Demografia, é **uma página só**, que troca de tela pelo endereço: `?p=<aba>&lv=BR|SP&v=<vista>&u=<lugar>&m=<município>`.
- O código está descompactado em `codigo/`:
  - `molde-saude.js`: todo o comportamento;
  - `config-saude.js`: abas, medidas, causas de morte pela CID, vacinas, doenças e textos;
  - `base.js` e `molde-economia.js`: as mesmas peças da Demografia;
  - `geo-mun-sp.js`: malha de SP com a população;
  - `telas.html`: o HTML e os estilos.

**Todos os números das telas são de exemplo ("00,0", selo "Exemplo").** Cores e tamanhos também são ilustrativos. Antes de ir ao ar, cada número precisa vir de um script nosso.

## Abas (5 grupos, 12 abas)
| Grupo | Aba | O que o design mostra | Fonte (a conferir) |
|---|---|---|---|
| — | **Visão geral** | 4 medidas no mapa: mortes padronizadas por idade, mortalidade infantil, médicos por mil e gasto público por habitante | SIM, CNES, SIOPS, IBGE |
| Nascer e morrer | **Causas de morte** | Grupos da **CID-10** (coração, câncer, causas externas, respiratórias, diabetes, digestivas, infecciosas, sistema nervoso, Covid-19, outras, mal definidas), por idade, no tempo desde 1996 | SIM |
| Nascer e morrer | **Mortalidade infantil e materna** | Infantil por mil nascidos; materna como **média de 3 anos com faixa provável** | SIM + SINASC |
| Nascer e morrer | **Nascimentos** | Pré-natal com 7 ou mais consultas, cesáreas, mães até 19 anos, baixo peso | SINASC |
| Nascer e morrer | **Esperança de vida** | Link para a Demografia | (já no site) |
| Prevenção e hábitos | **Vacinação** | 10 vacinas do calendário infantil × meta (90% ou 95%), "quanto falta para a meta" | SI-PNI |
| Prevenção e hábitos | **Doenças acompanhadas** | Dengue e chikungunya **semana a semana** (selo Semanal); tuberculose, aids e sífilis congênita por ano | SINAN (dengue: talvez InfoDengue/Fiocruz) |
| Prevenção e hábitos | **Como as pessoas estão** | Saúde autoavaliada, doenças crônicas e hábitos, por sexo e idade; por município = só o número do estado | IBGE, Pesquisa Nacional de Saúde 2019 |
| Atendimento | **Rede de saúde** | Médicos, enfermeiros, leitos SUS e não SUS, UTI; **tempo até o hospital** (estado ok, município em breve) | CNES (mensal) + cálculo |
| Atendimento | **Internações e procedimentos** | Internações por grupo de causa; onde a pessoa foi atendida (mesmo município, outro município, outro estado) | SIH/SUS, SIA/SUS |
| Gasto e planos | **Gasto público** | Gasto por habitante e quem paga (União, estado, municípios) | SIOPS |
| Gasto e planos | **Planos de saúde** | % da população com plano médico | ANS |

Os níveis são **Brasil por estado** e **SP por município** (cinzas + vermelho da bandeira, como já decidido), com a **ficha do município**.

## Cuidados que o design já trouxe (manter)
- **Taxas padronizadas por idade** nas mortes: um lugar com mais idosos não aparece "pior" só por isso.
- **Números pequenos:**
  - municípios com menos de 20 mil habitantes usam a média de 3 anos;
  - abaixo de 5 mil habitantes aparece o aviso "poucos casos";
  - eventos raros (morte materna) aparecem com a faixa provável.
- **Selo "Preliminar"** para o ano mais recente, que ainda recebe registros (2025).
- Selos de frequência: Anual, Mensal, Semanal (dengue). "Ao vivo" só se a fonte for de verdade frequente.

## Diferença técnica da Demografia
A Demografia tinha 12 telas separadas. A Saúde é **um código só** (`molde-saude.js`) para todas as abas e níveis. Para ficar fiel, o caminho é o mesmo da Demografia: usar o código do design no site e **trocar os valores de exemplo** (a função `ill` e os "00,0") pelos números dos nossos scripts.
