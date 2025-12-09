-- Dropar a função antiga com 4 parâmetros
DROP FUNCTION IF EXISTS public.retroceder_pedido_para_etapa(uuid, text, text, uuid);

-- Recriar a função com 4 parâmetros mas com lógica corrigida
CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid, 
  p_etapa_destino text, 
  p_motivo_backlog text, 
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_etapa_atual text;
  v_pedido record;
BEGIN
  -- Buscar pedido e etapa atual
  SELECT pp.*, pe.etapa INTO v_pedido
  FROM pedidos_producao pp
  LEFT JOIN pedidos_etapas pe ON pe.pedido_id = pp.id AND pe.ativa = true
  WHERE pp.id = p_pedido_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;
  
  v_etapa_atual := COALESCE(v_pedido.etapa, 'aberto');
  
  -- Desativar etapa atual
  UPDATE pedidos_etapas 
  SET ativa = false, updated_at = now()
  WHERE pedido_id = p_pedido_id AND ativa = true;
  
  -- Deletar pontuações ANTES de deletar linhas (CORREÇÃO DO BUG)
  DELETE FROM pontuacao_colaboradores 
  WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = p_pedido_id);
  
  -- Deletar linhas de ordens existentes
  DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
  
  -- Deletar ordens existentes
  DELETE FROM ordens_producao WHERE pedido_id = p_pedido_id;
  
  -- Criar nova etapa no destino
  INSERT INTO pedidos_etapas (pedido_id, etapa, ativa, created_at, updated_at)
  VALUES (p_pedido_id, p_etapa_destino, true, now(), now());
  
  -- Atualizar pedido
  UPDATE pedidos_producao
  SET 
    updated_at = now(),
    motivo_backlog = p_motivo_backlog
  WHERE id = p_pedido_id;
  
  -- Registrar no histórico
  INSERT INTO pedidos_etapas_historico (
    pedido_id, 
    etapa_origem, 
    etapa_destino, 
    tipo_movimentacao, 
    motivo,
    usuario_id,
    created_at
  )
  VALUES (
    p_pedido_id,
    v_etapa_atual,
    p_etapa_destino,
    'retrocesso',
    p_motivo_backlog,
    p_user_id,
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'etapa_anterior', v_etapa_atual,
    'etapa_nova', p_etapa_destino
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;