-- Corrigir nomes das colunas na função retroceder_pedido_para_etapa
DROP FUNCTION IF EXISTS public.retroceder_pedido_para_etapa(uuid, text, text);

CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id uuid,
  p_etapa_destino text,
  p_motivo_backlog text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_etapa_atual text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Buscar etapa atual
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;
  
  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;
  
  -- Validar se pode retroceder
  IF v_etapa_atual = 'aberto' THEN
    RAISE EXCEPTION 'Pedido já está na etapa inicial';
  END IF;
  
  -- Processar retrocesso baseado na etapa destino
  IF p_etapa_destino = 'aberto' THEN
    -- Deletar pontuações ANTES de deletar linhas
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (SELECT id FROM linhas_ordens WHERE pedido_id = p_pedido_id);
    
    -- Deletar todas as linhas de ordens
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id;
    
    -- Deletar todas as ordens de produção
    DELETE FROM ordens_perfiladeira WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_soldagem WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_separacao WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    
    -- Deletar instalações e carregamentos
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
  ELSIF p_etapa_destino = 'em_producao' THEN
    -- Deletar pontuações de qualidade e pintura ANTES de deletar linhas
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (
      SELECT id FROM linhas_ordens 
      WHERE pedido_id = p_pedido_id 
      AND tipo_ordem IN ('qualidade', 'pintura')
    );
    
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem IN ('qualidade', 'pintura');
    DELETE FROM ordens_qualidade WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
  ELSIF p_etapa_destino = 'inspecao_qualidade' THEN
    -- Deletar pontuações de pintura ANTES de deletar linhas
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (
      SELECT id FROM linhas_ordens 
      WHERE pedido_id = p_pedido_id 
      AND tipo_ordem = 'pintura'
    );
    
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
  ELSIF p_etapa_destino = 'aguardando_pintura' THEN
    -- Deletar pontuações de pintura ANTES de deletar linhas
    DELETE FROM pontuacao_colaboradores 
    WHERE linha_id IN (
      SELECT id FROM linhas_ordens 
      WHERE pedido_id = p_pedido_id 
      AND tipo_ordem = 'pintura'
    );
    
    DELETE FROM linhas_ordens WHERE pedido_id = p_pedido_id AND tipo_ordem = 'pintura';
    DELETE FROM ordens_pintura WHERE pedido_id = p_pedido_id;
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
    
  ELSIF p_etapa_destino IN ('aguardando_coleta', 'aguardando_instalacao') THEN
    DELETE FROM instalacoes WHERE pedido_id = p_pedido_id;
    DELETE FROM ordens_carregamento WHERE pedido_id = p_pedido_id;
  END IF;
  
  -- Fechar etapa atual
  UPDATE pedidos_etapas
  SET data_saida = now()
  WHERE pedido_id = p_pedido_id
  AND etapa = v_etapa_atual
  AND data_saida IS NULL;
  
  -- Criar entrada na nova etapa
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
  VALUES (p_pedido_id, p_etapa_destino, now());
  
  -- Atualizar pedido para nova etapa e marcar como backlog
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino,
    em_backlog = true,
    updated_at = now()
  WHERE id = p_pedido_id;
  
  -- Registrar movimentação (usar user_id e descricao, não realizado_por e observacoes)
  INSERT INTO pedidos_movimentacoes (
    pedido_id,
    etapa_origem,
    etapa_destino,
    user_id,
    teor,
    descricao
  ) VALUES (
    p_pedido_id,
    v_etapa_atual,
    p_etapa_destino,
    v_user_id,
    'retrocesso',
    'RETROCESSO: ' || p_motivo_backlog
  );
  
  RAISE LOG '[retroceder_pedido] Pedido % retrocedido de % para %', p_pedido_id, v_etapa_atual, p_etapa_destino;
END;
$function$;