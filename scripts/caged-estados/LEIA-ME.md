# Script: Empregos com carteira por estado (Novo Caged)

## O que faz
Calcula o **saldo de empregos com carteira assinada** de cada estado no mês mais recente: quantas pessoas foram contratadas menos quantas foram desligadas. Aparece na ficha da aba **Trabalho e renda**.

## De onde vem
**Novo Caged**, do Ministério do Trabalho e Emprego. Em 2026 o Ministério não publica mais planilha por estado, só PDF e os **microdados** (o arquivo com cada contratação e cada desligamento do país, um por linha). O script baixa os microdados do servidor oficial:

`ftp://ftp.mtps.gov.br/pdet/microdados/NOVO CAGED/<ano>/<anomês>/CAGEDMOV<anomês>.7z`

Ele soma a coluna "saldomovimentação" por estado (coluna "uf"). O total do país inclui algumas movimentações sem estado identificado (código 99), que não aparecem em nenhum estado.

**Conferência (setembro de 2026):** Brasil 121.305; São Paulo +19.391; Pernambuco +13.371; Alagoas +11.110; Santa Catarina +7.086; Nordeste 49.142; 26 estados positivos. Todos iguais aos números oficiais ([notícia do Ministério](https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/novembro/pais-gerou-1-248-mil-empregos-formais-ate-setembro-de-2026)).

## Como rodar
Na pasta `statworld` (o arquivo tem cerca de 50 MB; leva 1 a 3 minutos):

```
node scripts/caged-estados/baixar.mjs
```

Precisa do `curl` (já vem no Windows 10/11) e do pacote `7zip-bin`, que abre arquivos .7z e é instalado com `npm install`. O arquivo baixado é apagado no fim.

## O que ele cria
`dados/trabalho/brasil-caged.json`. Não edite à mão; rode o script de novo.

## Quando rodar de novo (todo mês)
O Ministério divulga um mês novo no fim do mês seguinte ou no começo do outro (ex.: setembro saiu em 4 de novembro).
1. Rode o comando. O script pega sozinho o mês mais recente.
2. Se ele avisar "ponha em DIVULGACOES a data…", abra o `baixar.mjs` e acrescente, no topo, o mês (ex.: `'202610'`), a data da notícia oficial do Ministério e o link dela. Rode de novo. Até isso ser feito, o site mostra o número sem a data de divulgação.
3. Confira o total do Brasil com a notícia oficial.

## Se der erro
- "mudou de formato": o Ministério mudou as colunas do arquivo; peça ajuda ao Claude.
- Erro de rede ou arquivo vazio: o servidor do Ministério pode estar fora do ar. Tente mais tarde.
- Os meses anteriores podem ser **revisados** depois (declarações fora do prazo, arquivos CAGEDFOR e CAGEDEXC). O site mostra sempre o número da primeira divulgação do mês mais recente, como na notícia oficial.
