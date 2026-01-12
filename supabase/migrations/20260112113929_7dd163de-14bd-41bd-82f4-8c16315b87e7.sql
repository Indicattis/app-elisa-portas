-- Function to get all linked items for a sale (to display in confirmation modal)
CREATE OR REPLACE FUNCTION public.get_venda_itens_vinculados(p_venda_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_pedido_id uuid;
  v_pedido_numero text;
  v_pedido_status text;
BEGIN
  -- Get the associated order
  SELECT id, numero_pedido, status INTO v_pedido_id, v_pedido_numero, v_pedido_status 
  FROM pedidos_producao WHERE venda_id = p_venda_id;
  
  v_result := jsonb_build_object(
    'pedido', CASE WHEN v_pedido_id IS NOT NULL THEN 
      jsonb_build_object('numero', v_pedido_numero, 'status', v_pedido_status, 'id', v_pedido_id)
    ELSE NULL END,
    'contas_receber', (SELECT COUNT(*) FROM contas_receber WHERE venda_id = p_venda_id),
    'instalacoes', (SELECT COUNT(*) FROM instalacoes WHERE venda_id = p_venda_id),
    'contratos', (SELECT COUNT(*) FROM contratos_vendas WHERE venda_id = p_venda_id),
    'notas_fiscais', (SELECT COUNT(*) FROM notas_fiscais WHERE venda_id = p_venda_id),
    'autorizacoes_desconto', (SELECT COUNT(*) FROM vendas_autorizacoes_desconto WHERE venda_id = p_venda_id),
    'ordens_carregamento', (SELECT COUNT(*) FROM ordens_carregamento WHERE venda_id = p_venda_id OR pedido_id = v_pedido_id),
    'ordens_soldagem', COALESCE((SELECT COUNT(*) FROM ordens_soldagem WHERE pedido_id = v_pedido_id), 0),
    'ordens_perfiladeira', COALESCE((SELECT COUNT(*) FROM ordens_perfiladeira WHERE pedido_id = v_pedido_id), 0),
    'ordens_pintura', COALESCE((SELECT COUNT(*) FROM ordens_pintura WHERE pedido_id = v_pedido_id), 0),
    'ordens_qualidade', COALESCE((SELECT COUNT(*) FROM ordens_qualidade WHERE pedido_id = v_pedido_id), 0),
    'ordens_separacao', COALESCE((SELECT COUNT(*) FROM ordens_separacao WHERE pedido_id = v_pedido_id), 0),
    'ordens_terceirizacao', COALESCE((SELECT COUNT(*) FROM ordens_terceirizacao WHERE pedido_id = v_pedido_id), 0),
    'ordens_porta_social', COALESCE((SELECT COUNT(*) FROM ordens_porta_social WHERE pedido_id = v_pedido_id), 0),
    'linhas_ordens', COALESCE((SELECT COUNT(*) FROM linhas_ordens WHERE pedido_id = v_pedido_id), 0),
    'pontuacoes', COALESCE((
      SELECT COUNT(*) FROM pontuacao_colaboradores WHERE ordem_id IN (
        SELECT id FROM ordens_soldagem WHERE pedido_id = v_pedido_id
        UNION SELECT id FROM ordens_perfiladeira WHERE pedido_id = v_pedido_id
        UNION SELECT id FROM ordens_pintura WHERE pedido_id = v_pedido_id
        UNION SELECT id FROM ordens_qualidade WHERE pedido_id = v_pedido_id
        UNION SELECT id FROM ordens_separacao WHERE pedido_id = v_pedido_id
      )
    ), 0)
  );
  
  RETURN v_result;
END;
$$;

-- Function to delete a sale and all its linked items
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
  -- Get the associated order
  SELECT id INTO v_pedido_id FROM pedidos_producao WHERE venda_id = p_venda_id;
  
  IF v_pedido_id IS NOT NULL THEN
    -- Collect all order IDs to delete related scores
    SELECT ARRAY_AGG(id) INTO v_ordem_ids FROM (
      SELECT id FROM ordens_soldagem WHERE pedido_id = v_pedido_id
      UNION SELECT id FROM ordens_perfiladeira WHERE pedido_id = v_pedido_id
      UNION SELECT id FROM ordens_pintura WHERE pedido_id = v_pedido_id
      UNION SELECT id FROM ordens_qualidade WHERE pedido_id = v_pedido_id
      UNION SELECT id FROM ordens_separacao WHERE pedido_id = v_pedido_id
    ) ordens;
    
    -- Delete scores first
    IF v_ordem_ids IS NOT NULL THEN
      DELETE FROM pontuacao_colaboradores WHERE ordem_id = ANY(v_ordem_ids);
    END IF;
    
    -- Delete production orders
    DELETE FROM ordens_soldagem WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_terceirizacao WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_porta_social WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_producao WHERE pedido_id = v_pedido_id;
    DELETE FROM linhas_ordens WHERE pedido_id = v_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = v_pedido_id;
    
    -- Delete order-related records
    DELETE FROM pedido_linhas WHERE pedido_id = v_pedido_id;
    DELETE FROM pedidos_etapas WHERE pedido_id = v_pedido_id;
    DELETE FROM pedidos_movimentacoes WHERE pedido_id = v_pedido_id;
    DELETE FROM pedidos_backlog_ativo WHERE pedido_id = v_pedido_id;
    DELETE FROM pedido_porta_observacoes WHERE pedido_id = v_pedido_id;
    DELETE FROM pedido_porta_social_observacoes WHERE pedido_id = v_pedido_id;
    
    -- Delete the order itself
    DELETE FROM pedidos_producao WHERE id = v_pedido_id;
  END IF;
  
  -- Delete sale-related records
  DELETE FROM contas_receber WHERE venda_id = p_venda_id;
  DELETE FROM contratos_vendas WHERE venda_id = p_venda_id;
  DELETE FROM vendas_autorizacoes_desconto WHERE venda_id = p_venda_id;
  DELETE FROM notas_fiscais WHERE venda_id = p_venda_id;
  DELETE FROM instalacoes WHERE venda_id = p_venda_id;
  DELETE FROM ordens_carregamento WHERE venda_id = p_venda_id;
  DELETE FROM produtos_vendas WHERE venda_id = p_venda_id;
  
  -- Delete the sale
  DELETE FROM vendas WHERE id = p_venda_id;
END;
$$;