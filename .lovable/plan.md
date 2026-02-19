
# Corrigir exibicao de tamanho e etiquetas nas ordens de pintura

## Problema

Duas falhas relacionadas na ordem PINT-00089:

1. **Tamanho nao aparece nas linhas**: O campo `tamanho` dos itens (ex: "Meia cana lisa" deveria mostrar 7,66m) nao aparece porque o sistema tenta buscar esse dado da tabela `pedido_linhas`, mas a query nao inclui o campo `id`, quebrando o mecanismo de deduplicacao -- apos o primeiro item encontrado, todos os demais falham.

2. **Etiqueta mostra tamanho da porta**: Ao imprimir, os campos `largura` e `altura` usam como fallback as dimensoes da **porta** (ex: 7,50m x 4,82m), quando deveriam usar o `tamanho` do material (ex: 7,66m).

## Solucao

### Alteracao 1: `src/hooks/useOrdemPintura.ts`

**Adicionar `id` na query de `pedido_linhas`** (linha 94):

```
.select('id, nome_produto, produto_venda_id, quantidade, tamanho')
```

Isso corrige o mecanismo de deduplicacao que usa `lp.id` para evitar reutilizar linhas ja associadas.

### Alteracao 2: `src/hooks/useOrdemPintura.ts`

**Remover fallback de largura/altura para dimensoes da porta** (linhas 147-148):

Manter `largura` e `altura` somente quando vierem da propria `linhas_ordens`, sem usar `produtoVenda?.largura/altura` como fallback. As dimensoes da porta devem ficar apenas no cabecalho do grupo, nao nos itens individuais.

De:
```typescript
largura: linha.largura || produtoVenda?.largura || null,
altura: linha.altura || produtoVenda?.altura || null,
```

Para:
```typescript
largura: linha.largura || null,
altura: linha.altura || null,
```

### Resultado esperado

- O tamanho "7,66m" aparecera ao lado da quantidade nas linhas da ordem de pintura
- As etiquetas impressas mostrarao o tamanho do material (7,66m) em vez das dimensoes da porta
- O cabecalho do grupo continua mostrando as dimensoes da porta normalmente
