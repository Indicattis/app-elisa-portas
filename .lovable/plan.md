
# Filtrar itens de separacao das ordens de embalagem

## Problema

A funcao `criar_ordem_embalagem` no banco de dados copia TODAS as linhas de `pedido_linhas` para a ordem de embalagem, incluindo itens de separacao (como "Cuica + Parafusos", "Central WI-FI"). A embalagem deve conter apenas itens dos setores de solda e perfiladeira.

## Solucao

### 1. Atualizar a funcao SQL `criar_ordem_embalagem`

Adicionar filtro no loop que copia linhas de `pedido_linhas`, excluindo itens com `tipo_ordem = 'separacao'`:

```sql
CREATE OR REPLACE FUNCTION public.criar_ordem_embalagem(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
...
  FOR v_linha IN
    SELECT pl.nome_produto, pl.quantidade, pl.tamanho, pl.estoque_id, pl.produto_venda_id
    FROM pedido_linhas pl
    WHERE pl.pedido_id = p_pedido_id
      AND (pl.tipo_ordem IS DISTINCT FROM 'separacao')
  LOOP
    ...
  END LOOP;
...
```

A condicao `IS DISTINCT FROM 'separacao'` inclui linhas com `tipo_ordem` igual a `perfiladeira`, `soldagem` ou `NULL`, excluindo apenas `separacao`.

### 2. Limpar dados existentes

Remover linhas de embalagem que vieram de itens de separacao nas ordens ativas:

```sql
DELETE FROM linhas_ordens lo
USING pedido_linhas pl
WHERE lo.tipo_ordem = 'embalagem'
  AND lo.produto_venda_id = pl.produto_venda_id
  AND lo.pedido_id = pl.pedido_id
  AND pl.tipo_ordem = 'separacao'
  AND EXISTS (
    SELECT 1 FROM ordens_embalagem oe
    WHERE oe.id = lo.ordem_id AND oe.historico = false
  );
```

### Resumo das alteracoes

- **Migration SQL**: recria a funcao `criar_ordem_embalagem` com filtro e executa limpeza dos dados existentes
- **Nenhuma alteracao de frontend** -- o hook `useOrdemEmbalagem` ja busca as linhas da tabela `linhas_ordens` normalmente; com menos linhas inseridas, a listagem reflete automaticamente
