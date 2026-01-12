-- Fix: Remove delete from view pedidos_backlog_ativo (it's a view, not a table)
CREATE OR REPLACE FUNCTION public.delete_venda_completa(p_venda_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id uuid;
  v_ordem_ids uuid[];
BEGIN
  -- Buscar pedido associado
  SELECT id INTO v_pedido_id FROM pedidos_producao WHERE venda_id = p_venda_id;
  
  IF v_pedido_id IS NOT NULL THEN
    -- Coletar IDs de todas as ordens para excluir pontuações
    SELECT ARRAY_AGG(id) INTO v_ordem_ids FROM (
      SELECT id FROM ordens_soldagem WHERE pedido_id = v_pedido_id
      UNION ALL SELECT id FROM ordens_perfiladeira WHERE pedido_id = v_pedido_id
      UNION ALL SELECT id FROM ordens_pintura WHERE pedido_id = v_pedido_id
      UNION ALL SELECT id FROM ordens_qualidade WHERE pedido_id = v_pedido_id
      UNION ALL SELECT id FROM ordens_separacao WHERE pedido_id = v_pedido_id
    ) ordens;
    
    -- Excluir pontuações vinculadas às ordens
    IF v_ordem_ids IS NOT NULL AND array_length(v_ordem_ids, 1) > 0 THEN
      DELETE FROM pontuacao_colaboradores WHERE ordem_id = ANY(v_ordem_ids);
    END IF;
    
    -- Excluir ordens de produção
    DELETE FROM ordens_soldagem WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_terceirizacao WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_porta_social WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_producao WHERE pedido_id = v_pedido_id;
    DELETE FROM linhas_ordens WHERE pedido_id = v_pedido_id;
    
    -- Excluir registros do pedido
    DELETE FROM pedido_linhas WHERE pedido_id = v_pedido_id;
    DELETE FROM pedidos_etapas WHERE pedido_id = v_pedido_id;
    DELETE FROM pedidos_movimentacoes WHERE pedido_id = v_pedido_id;
    -- pedidos_backlog_ativo é uma VIEW, não pode deletar diretamente
    DELETE FROM pedido_porta_observacoes WHERE pedido_id = v_pedido_id;
    DELETE FROM pedido_porta_social_observacoes WHERE pedido_id = v_pedido_id;
    
    -- Excluir pedido
    DELETE FROM pedidos_producao WHERE id = v_pedido_id;
  END IF;
  
  -- Excluir registros diretos da venda
  DELETE FROM contas_receber WHERE venda_id = p_venda_id;
  DELETE FROM contratos_vendas WHERE venda_id = p_venda_id;
  DELETE FROM vendas_autorizacoes_desconto WHERE venda_id = p_venda_id;
  DELETE FROM notas_fiscais WHERE venda_id = p_venda_id;
  DELETE FROM instalacoes WHERE venda_id = p_venda_id;
  DELETE FROM ordens_carregamento WHERE venda_id = p_venda_id;
  DELETE FROM produtos_vendas WHERE venda_id = p_venda_id;
  
  -- Excluir venda
  DELETE FROM vendas WHERE id = p_venda_id;
END;
$$;