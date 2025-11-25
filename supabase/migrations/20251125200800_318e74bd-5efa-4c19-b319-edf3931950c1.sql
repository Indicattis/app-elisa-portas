-- Criar função para retornar pedido da qualidade para produção
CREATE OR REPLACE FUNCTION retornar_pedido_para_producao(
  p_pedido_id UUID,
  p_ordem_qualidade_id UUID,
  p_motivo TEXT,
  p_ordens_reativar TEXT[], -- Array com tipos: 'soldagem', 'perfiladeira', 'separacao'
  p_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo TEXT;
  v_tabela TEXT;
BEGIN
  -- Validar parâmetros
  IF p_motivo IS NULL OR p_motivo = '' THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;

  IF p_ordens_reativar IS NULL OR array_length(p_ordens_reativar, 1) IS NULL THEN
    RAISE EXCEPTION 'Selecione pelo menos uma ordem para reativar';
  END IF;

  -- Excluir linhas da ordem de qualidade
  DELETE FROM linhas_ordens 
  WHERE ordem_id = p_ordem_qualidade_id AND tipo_ordem = 'qualidade';

  -- Excluir a ordem de qualidade
  DELETE FROM ordens_qualidade WHERE id = p_ordem_qualidade_id;

  -- Reativar as ordens selecionadas
  FOREACH v_tipo IN ARRAY p_ordens_reativar
  LOOP
    -- Determinar a tabela correta
    v_tabela := 'ordens_' || v_tipo;
    
    -- Atualizar ordens para status pendente e em_backlog true
    IF v_tipo = 'soldagem' THEN
      UPDATE ordens_soldagem 
      SET status = 'pendente', 
          historico = false, 
          em_backlog = true,
          responsavel_id = NULL,
          data_conclusao = NULL,
          updated_at = now()
      WHERE pedido_id = p_pedido_id;
      
      -- Resetar linhas
      UPDATE linhas_ordens 
      SET concluida = false, concluida_em = NULL, concluida_por = NULL
      WHERE pedido_id = p_pedido_id AND tipo_ordem = 'soldagem';
      
    ELSIF v_tipo = 'perfiladeira' THEN
      UPDATE ordens_perfiladeira 
      SET status = 'pendente', 
          historico = false, 
          em_backlog = true,
          responsavel_id = NULL,
          data_conclusao = NULL,
          updated_at = now()
      WHERE pedido_id = p_pedido_id;
      
      UPDATE linhas_ordens 
      SET concluida = false, concluida_em = NULL, concluida_por = NULL
      WHERE pedido_id = p_pedido_id AND tipo_ordem = 'perfiladeira';
      
    ELSIF v_tipo = 'separacao' THEN
      UPDATE ordens_separacao 
      SET status = 'pendente', 
          historico = false, 
          em_backlog = true,
          responsavel_id = NULL,
          data_conclusao = NULL,
          updated_at = now()
      WHERE pedido_id = p_pedido_id;
      
      UPDATE linhas_ordens 
      SET concluida = false, concluida_em = NULL, concluida_por = NULL
      WHERE pedido_id = p_pedido_id AND tipo_ordem = 'separacao';
    END IF;
  END LOOP;

  -- Fechar etapa atual de qualidade
  UPDATE pedidos_etapas 
  SET data_saida = now()
  WHERE pedido_id = p_pedido_id 
    AND etapa = 'inspecao_qualidade' 
    AND data_saida IS NULL;

  -- Criar nova entrada para etapa em_producao
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada, checkboxes)
  VALUES (
    p_pedido_id, 
    'em_producao', 
    now(),
    '[]'::jsonb
  );

  -- Atualizar o pedido para em_producao e marcar como backlog
  UPDATE pedidos_producao 
  SET etapa_atual = 'em_producao',
      em_backlog = true,
      observacoes = COALESCE(observacoes, '') || E'\n\n[RETORNO QUALIDADE ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ']: ' || p_motivo,
      updated_at = now()
  WHERE id = p_pedido_id;

END;
$$;