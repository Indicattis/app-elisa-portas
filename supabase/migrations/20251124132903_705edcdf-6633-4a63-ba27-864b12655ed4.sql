-- Corrigir função retroceder_pedido_para_etapa removendo coluna data_backlog inexistente
CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid,
  p_etapa_destino text,
  p_motivo_backlog text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_etapa_atual text;
  v_max_prioridade integer;
BEGIN
  -- Obter etapa atual
  SELECT etapa_atual INTO v_etapa_atual 
  FROM pedidos_producao 
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado: %', p_pedido_id;
  END IF;

  -- Registrar movimentação no histórico
  INSERT INTO public.pedidos_movimentacoes (
    pedido_id,
    user_id,
    etapa_origem,
    etapa_destino,
    teor,
    descricao,
    data_hora
  ) VALUES (
    p_pedido_id,
    auth.uid(),
    v_etapa_atual,
    p_etapa_destino,
    'backlog',
    p_motivo_backlog,
    NOW()
  );

  -- Obter maior prioridade da etapa de destino
  SELECT COALESCE(MAX(prioridade_etapa), 0) INTO v_max_prioridade
  FROM pedidos_producao 
  WHERE etapa_atual = p_etapa_destino;

  RAISE LOG '[retroceder] Pedido: %, Etapa atual: %, Destino: %', p_pedido_id, v_etapa_atual, p_etapa_destino;

  -- Continuar com lógica de retrocesso existente...
  IF p_etapa_destino = 'aberto' THEN
    RAISE LOG '[retroceder] CASO 1: Excluindo TUDO (ordens, linhas, instalações, entregas)';
    
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes_cadastradas WHERE pedido_id = p_pedido_id;
    DELETE FROM entregas WHERE pedido_id = p_pedido_id;
    
    RAISE LOG '[retroceder] Tudo excluído para pedido %', p_pedido_id;

  ELSIF p_etapa_destino = 'em_producao' THEN
    RAISE LOG '[retroceder] CASO 2: MANTER ordens de produção base, EXCLUIR qualidade e pintura';
    
    DELETE FROM linhas_ordens 
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('qualidade', 'pintura');
    
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_soldagem 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_perfiladeira 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_separacao 
    SET status = 'pendente', 
        data_inicio = NULL, 
        data_conclusao = NULL, 
        responsavel_id = NULL,
        em_backlog = true, 
        prioridade = v_max_prioridade + 1000,
        historico = FALSE
    WHERE pedido_id = p_pedido_id;
    
    UPDATE linhas_ordens
    SET concluida = false, concluida_em = NULL, concluida_por = NULL
    WHERE pedido_id = p_pedido_id 
    AND tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao');
    
    UPDATE instalacoes_cadastradas
    SET status = 'em_producao'
    WHERE pedido_id = p_pedido_id;

  ELSIF p_etapa_destino = 'inspecao_qualidade' THEN
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    
    UPDATE ordens_qualidade 
    SET status = 'pendente',
        em_backlog = true,
        prioridade = v_max_prioridade + 1000
    WHERE pedido_id = p_pedido_id;

  ELSIF p_etapa_destino = 'aguardando_pintura' THEN
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
  END IF;

  -- Fechar etapas abertas
  UPDATE pedidos_etapas 
  SET data_saida = NOW() 
  WHERE pedido_id = p_pedido_id 
  AND data_saida IS NULL;

  -- Criar nova etapa destino
  INSERT INTO pedidos_etapas (pedido_id, etapa)
  SELECT p_pedido_id, p_etapa_destino
  WHERE NOT EXISTS (
    SELECT 1 FROM pedidos_etapas 
    WHERE pedido_id = p_pedido_id 
    AND etapa = p_etapa_destino 
    AND data_saida IS NULL
  );

  -- Atualizar pedido (REMOVIDO data_backlog que não existe)
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino,
    status = CASE 
      WHEN p_etapa_destino = 'aberto' THEN 'pendente'
      ELSE 'em_andamento'
    END,
    em_backlog = true,
    motivo_backlog = p_motivo_backlog,
    etapa_origem_backlog = v_etapa_atual,
    prioridade_etapa = v_max_prioridade + 1000,
    updated_at = NOW()
  WHERE id = p_pedido_id;
  
END;
$function$;