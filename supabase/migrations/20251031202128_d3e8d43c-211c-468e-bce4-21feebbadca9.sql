-- Atualizar função para resetar pedido e excluir ordens
CREATE OR REPLACE FUNCTION resetar_pedido_para_aberto(p_pedido_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Excluir todas as linhas de ordens relacionadas ao pedido
  DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
  
  -- 2. Excluir todas as ordens de produção do pedido
  DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
  DELETE FROM ordens_instalacao WHERE pedido_id = p_pedido_id;
  
  -- 3. Fechar todas as etapas abertas do pedido
  UPDATE pedidos_etapas 
  SET data_saida = NOW() 
  WHERE pedido_id = p_pedido_id 
  AND data_saida IS NULL;
  
  -- 4. Criar nova etapa "aberto" com checkboxes padrão
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
  VALUES (
    p_pedido_id,
    'aberto',
    '[
      {
        "id": "check_producao_ok",
        "label": "Pedido está pronto para produção",
        "checked": false,
        "required": true
      }
    ]'::jsonb
  );
  
  -- 5. Atualizar o pedido para etapa "aberto"
  UPDATE pedidos_producao
  SET 
    etapa_atual = 'aberto',
    status = 'pendente',
    prioridade_etapa = 0,
    updated_at = NOW()
  WHERE id = p_pedido_id;
  
END;
$$;