-- Função para resetar pedido completamente para a etapa "aberto"
CREATE OR REPLACE FUNCTION resetar_pedido_para_aberto(p_pedido_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Desmarcar todas as linhas de ordens
  UPDATE linhas_ordens 
  SET concluida = false,
      concluida_em = NULL,
      concluida_por = NULL
  WHERE pedido_id = p_pedido_id;
  
  -- 2. Resetar ordens de soldagem
  UPDATE ordens_soldagem
  SET status = 'pendente',
      data_inicio = NULL,
      data_conclusao = NULL,
      responsavel_id = NULL
  WHERE pedido_id = p_pedido_id;
  
  -- 3. Resetar ordens de perfiladeira
  UPDATE ordens_perfiladeira
  SET status = 'pendente',
      data_inicio = NULL,
      data_conclusao = NULL,
      responsavel_id = NULL
  WHERE pedido_id = p_pedido_id;
  
  -- 4. Resetar ordens de separação
  UPDATE ordens_separacao
  SET status = 'pendente',
      data_inicio = NULL,
      data_conclusao = NULL,
      responsavel_id = NULL
  WHERE pedido_id = p_pedido_id;
  
  -- 5. Resetar ordens de qualidade
  UPDATE ordens_qualidade
  SET status = 'pendente',
      data_inicio = NULL,
      data_conclusao = NULL,
      responsavel_id = NULL
  WHERE pedido_id = p_pedido_id;
  
  -- 6. Resetar ordens de pintura
  UPDATE ordens_pintura
  SET status = 'pendente',
      data_inicio = NULL,
      data_conclusao = NULL,
      responsavel_id = NULL
  WHERE pedido_id = p_pedido_id;
  
  -- 7. Deletar histórico de etapas
  DELETE FROM pedidos_etapas
  WHERE pedido_id = p_pedido_id;
  
  -- 8. Criar nova etapa "aberto"
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes)
  VALUES (p_pedido_id, 'aberto', '[]'::jsonb);
  
  -- 9. Atualizar pedido
  UPDATE pedidos_producao
  SET etapa_atual = 'aberto',
      status = 'em_andamento',
      prioridade_etapa = 0,
      updated_at = now()
  WHERE id = p_pedido_id;
END;
$$;