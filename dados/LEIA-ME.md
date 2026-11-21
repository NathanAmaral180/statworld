# Pasta dados/

Aqui ficam **todos os números do site**. Nenhuma página tem número escrito dentro dela: as páginas leem daqui.

## Regras
- Todo número vem com **fonte** (quem publicou) e **data** (quando foi publicado / a que período se refere).
- Quando não existe o número, use `null` e o site mostra **"sem dado"**. Nunca coloque `0` no lugar de "sem dado".
- Os arquivos são gerados pelos scripts da pasta `scripts/` sempre que possível, e não digitados à mão.

## Formato combinado (exemplo de estrutura, sem números reais)
```json
{
  "indicador": "nome-do-indicador",
  "unidade": "%",
  "fonte": { "nome": "Nome da instituição", "publicacao": "Nome da publicação", "url": "https://...", "dataDivulgacao": "AAAA-MM-DD" },
  "periodo": "AAAA",
  "valores": { "SP": null, "RJ": null }
}
```

Por enquanto a pasta está vazia de propósito: nenhum dado real foi colocado ainda.
