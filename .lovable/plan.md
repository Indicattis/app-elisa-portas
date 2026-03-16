

## Plano: Corrigir exclusão de pedido em /direcao/pedidos/:id

### Causa raiz

A função RPC `deletar_pedido_completo` **não** tem `SECURITY DEFINER`, então ela executa com as permissões do usuário logado. A política de DELETE na tabela `pedidos_producao` exige `is_admin()`:

```
DELETE policy: "Admins can delete pedidos_producao" → qual: is_admin()
```

Outras tabelas deletadas pela função (como `linhas_ordens`) também têm DELETE restrito a admins. Se o usuário não é admin, a exclusão falha silenciosamente — a RPC retorna `true` mas as rows não são deletadas por causa do RLS.

Na sessão replay, o toast "Pedido excluído com sucesso" aparece porque a RPC não lança erro, mas o pedido continua existindo.

### Correção

**Migração SQL** — Recriar a função com `SECURITY DEFINER` para que ela execute com permissões do owner (bypassa RLS):

```sql
DROP FUNCTION IF EXISTS public.deletar_pedido_completo(UUID);

CREATE OR REPLACE FUNCTION public.deletar_pedido_completo(p_pedido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se o pedido existe
  IF NOT EXISTS (SELECT 1 FROM pedidos_producao WHERE id = p_pedido_id) THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

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

Com `SECURITY DEFINER`, a função bypassa as políticas RLS e qualquer usuário autenticado conseguirá excluir o pedido. Nenhuma alteração de código frontend é necessária.

