-- Corrigir função concluir_carregamento_instalacao
-- Remover INSERT em pedidos_movimentacoes pois:
-- 1. O carregamento não é uma mudança de etapa (origem = destino)
-- 2. O registro já existe na tabela instalacoes (carregamento_concluido_em, carregamento_concluido_por)
-- 3. O valor 'carregamento' não é permitido no constraint teor_check

CREATE OR REPLACE FUNCTION public.concluir_carregamento_instalacao(p_instalacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar carregamento como concluído na tabela instalacoes
  -- O pedido permanece em 'instalacoes' para finalização manual
  -- NÃO registra movimentação pois não há mudança de etapa
  UPDATE instalacoes
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = auth.uid(),
      updated_at = now()
  WHERE id = p_instalacao_id;
END;
$$;