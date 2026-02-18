
# Corrigir funcao `deletar_pedido_completo`

## Problema

A funcao RPC `deletar_pedido_completo` tenta deletar da tabela `ordens_producao`, que nao existe. As ordens sao armazenadas em tabelas individuais por setor:

- `ordens_soldagem`
- `ordens_perfiladeira`
- `ordens_pintura`
- `ordens_qualidade`
- `ordens_embalagem`
- `ordens_separacao`
- `ordens_carregamento`
- `ordens_terceirizacao`
- `ordens_porta_social`

## Solucao

Criar uma migration que recria a funcao `deletar_pedido_completo` deletando de todas as tabelas corretas, na ordem certa para respeitar dependencias:

1. `linhas_ordens` (depende das ordens)
2. Todas as 9 tabelas de ordens individuais
3. `pedido_porta_observacoes`
4. `pedido_porta_social_observacoes`
5. `pedido_linhas`
6. `pedidos_etapas`
7. `pedidos_movimentacoes`
8. `pedidos_producao` (tabela principal, por ultimo)

### SQL da migration

```sql
DROP FUNCTION IF EXISTS public.deletar_pedido_completo(UUID);

CREATE OR REPLACE FUNCTION public.deletar_pedido_completo(p_pedido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;

  DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_embalagem WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_terceirizacao WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_porta_social WHERE pedido_id = p_pedido_id;

  DELETE FROM pedido_porta_observacoes WHERE pedido_id = p_pedido_id;
  DELETE FROM pedido_porta_social_observacoes WHERE pedido_id = p_pedido_id;
  DELETE FROM pedido_linhas WHERE pedido_id = p_pedido_id;
  DELETE FROM pedidos_etapas WHERE pedido_id = p_pedido_id;
  DELETE FROM pedidos_movimentacoes WHERE pedido_id = p_pedido_id;

  DELETE FROM pedidos_producao WHERE id = p_pedido_id;

  RETURN TRUE;
END;
$$;
```

Nenhuma alteracao de codigo frontend e necessaria -- apenas a correcao da funcao no banco.
