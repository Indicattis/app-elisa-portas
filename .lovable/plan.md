
# Corrigir agrupamento por porta na downbar de Qualidade e Pintura

## Problema

Dois problemas interligados:

### 1. Linhas de qualidade sem `produto_venda_id` e `indice_porta`
A funcao SQL `criar_ordem_qualidade` copia linhas de `pedido_linhas` para `linhas_ordens`, mas nao inclui os campos `produto_venda_id` e `indice_porta`. Resultado: todas as 28+ linhas de qualidade ficam com `produto_venda_id = NULL`, agrupando tudo em uma unica porta na downbar.

A tabela `pedido_linhas` tem esses dados corretamente (7 portas distintas com `produto_venda_id` + `indice_porta`), mas eles se perdem na criacao da ordem.

### 2. Numeracao das observacoes de visita
Na downbar, a exibicao das observacoes usa `obs.indice_porta + 1` diretamente, que reinicia para cada `produto_venda_id` diferente. Resultado: em vez de "Porta 1, 2, 3, 4, 5, 6, 7", aparece "Porta 1, 1, 2, 3, 1, 2, 1".

## Solucao

### Parte 1: Migration SQL - Corrigir `criar_ordem_qualidade`
Recriar a funcao para incluir `produto_venda_id` e `indice_porta` no INSERT das linhas:

```sql
INSERT INTO linhas_ordens (
  pedido_id, ordem_id, tipo_ordem, item, quantidade, tamanho,
  concluida, estoque_id, produto_venda_id, indice_porta
) VALUES (
  p_pedido_id, v_ordem_id, 'qualidade',
  COALESCE(v_linha.nome_produto, v_linha.descricao_produto, 'Item'),
  COALESCE(v_linha.quantidade, 1),
  COALESCE(v_linha.tamanho, ...),
  false, v_linha.estoque_id,
  v_linha.produto_venda_id, v_linha.indice_porta
);
```

### Parte 2: Migration SQL - Corrigir dados existentes
Atualizar as linhas de qualidade ja criadas que estao com `produto_venda_id = NULL`, fazendo match pelo `pedido_id`, `estoque_id` e item:

```sql
UPDATE linhas_ordens lo
SET produto_venda_id = pl.produto_venda_id,
    indice_porta = pl.indice_porta
FROM pedido_linhas pl
WHERE lo.tipo_ordem = 'qualidade'
  AND lo.produto_venda_id IS NULL
  AND lo.pedido_id = pl.pedido_id
  AND lo.estoque_id = pl.estoque_id;
```

### Parte 3: Frontend - Numeracao global das observacoes
No arquivo `src/components/production/OrdemDetalhesSheet.tsx`, na secao de observacoes (linha ~631), trocar `obs.indice_porta + 1` por `idx + 1` para usar numeracao sequencial global:

De:
```tsx
Porta {obs.indice_porta + 1}
```
Para:
```tsx
Porta {idx + 1}
```

### Parte 4: Frontend - Agrupamento por porta expandida
Atualmente o agrupamento no `OrdemDetalhesSheet.tsx` usa apenas `produto_venda_id` como chave. Para portas com quantidade > 1 (ex: 3 portas de 4.75x6.00), todas as linhas ficam no mesmo grupo. Precisamos agrupar por `produto_venda_id` + `indice_porta`:

De:
```tsx
const key = linha.produto_venda_id || 'sem_porta';
```
Para:
```tsx
const key = linha.produto_venda_id 
  ? `${linha.produto_venda_id}_${linha.indice_porta ?? 0}` 
  : 'sem_porta';
```

E ajustar a busca de dimensoes para usar o `produto_venda_id` base (sem o indice) ao buscar no array de produtos.

## Arquivos afetados
1. Nova migration SQL (funcao + dados existentes)
2. `src/components/production/OrdemDetalhesSheet.tsx` (numeracao observacoes + agrupamento por porta expandida)
