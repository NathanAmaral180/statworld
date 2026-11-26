# Script: atividade econômica do estado, mês a mês

## O que faz
Mostra como está a economia do estado **agora**, sem esperar os 2 anos que o IBGE leva para publicar o PIB. Busca duas fontes:

1. **PIB mensal da Fundação Seade** (órgão de estatística do governo de São Paulo). Traz o crescimento do PIB e dos setores (agropecuária, indústria e serviços), já descontada a inflação:
   - no mês, comparado ao mês anterior (com ajuste sazonal, que tira os efeitos de calendário, como dezembro ser sempre mais forte);
   - comparado ao mesmo mês do ano anterior;
   - **acumulado no ano**;
   - acumulado em 12 meses;
   - e o índice mês a mês desde 2002, para o gráfico.
2. **Índice de Atividade Econômica Regional do Banco Central (IBCR-SP)**. Existe para vários estados, por isso serve para comparar estados entre si.
   - O crescimento em 12 meses do IBCR é **cálculo nosso**: soma dos últimos 12 meses do índice ÷ soma dos 12 anteriores.

Os dados da Seade são **preliminares**: a própria Seade revisa os números depois. O site deve mostrar isso.

## De onde vêm os dados
- Seade, PIB mensal (portal de dados abertos): https://repositorio.seade.gov.br/dataset/pib-mensal. O script pergunta ao portal qual é a planilha mais nova, então pega sozinho o mês mais recente.
- Banco Central, IBCR-SP: séries 25392 (sem ajuste) e 25394 (com ajuste sazonal) do SGS. https://dadosabertos.bcb.gov.br/dataset/25392-sgs

## Como rodar
Abra o PowerShell na pasta `statworld` e digite:

```
node scripts/atividade-estado/baixar.mjs
```

Deve aparecer algo como: `Pronto: PIB mensal de São Paulo até agosto de 2026 (no ano: 1.5%; 12 meses: 1.02%), IBCR-SP até setembro de 2026.`

## O que ele cria
`dados/economia/brasil-sp-atividade.json`. Não edite à mão; rode o script de novo.

## Outros estados
Cada estado tem o seu órgão de estatística, por exemplo a Fundação João Pinheiro em MG. Para incluir um estado:
1. Confira as fontes dele.
2. Acrescente o estado em `ESTADOS`, no começo do script.

Só entra estado com fonte conferida.

## Conferido (26 nov 2026)
O acumulado de janeiro a agosto de 2026 (1,5%) bate com a divulgação da Seade noticiada em novembro ("PIB paulista cresce 1,5% no acumulado de 2026").

## Quando roda
Todo dia, na rotina automática (`scripts/atualizar/rodar.mjs`). O site só muda quando sai um mês novo.

## Se der erro
- "A aba ... da Seade mudou" ou "As colunas ... mudaram": a Seade mudou a planilha. O script para, para não ler números errados. Peça ajuda ao Claude.
- "Não achei a planilha do PIB mensal": o portal da Seade mudou ou está fora do ar. Tente mais tarde.
- "Erro ... em https://api.bcb.gov.br": o Banco Central está fora do ar. Tente mais tarde.
