-- Corrigir função concluir_ordem_carregamento para definir status
DROP FUNCTION IF EXISTS public.concluir_ordem_carregamento(uuid);

CREATE OR REPLACE FUNCTION public.concluir_ordem_carregamento(p_ordem_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id UUID;
  v_etapa_atual TEXT;
BEGIN
  -- Buscar pedido_id
  SELECT pedido_id INTO v_pedido_id
  FROM ordens_carregamento
  WHERE id = p_ordem_id;
  
  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Ordem de carregamento não encontrada ou sem pedido associado';
  END IF;
  
  -- Buscar etapa atual do pedido
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = v_pedido_id;
  
  -- Validar que está em etapa de expedição
  IF v_etapa_atual NOT IN ('aguardando_coleta', 'aguardando_instalacao') THEN
    RAISE EXCEPTION 'Pedido não está em etapa de expedição';
  END IF;
  
  -- Marcar ordem como concluída COM STATUS CORRETO
  UPDATE ordens_carregamento
  SET carregamento_concluido = TRUE,
      carregamento_concluido_em = NOW(),
      carregamento_concluido_por = auth.uid(),
      status = 'concluida',  -- IMPORTANTE: definir status
      updated_at = NOW()
  WHERE id = p_ordem_id;
  
  -- Fechar etapa atual
  UPDATE pedidos_etapas
  SET data_saida = NOW()
  WHERE pedido_id = v_pedido_id
  AND etapa = v_etapa_atual
  AND data_saida IS NULL;
  
  -- Criar etapa "finalizado"
  INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
  VALUES (v_pedido_id, 'finalizado', NOW());
  
  -- Atualizar pedido
  UPDATE pedidos_producao
  SET etapa_atual = 'finalizado',
      status = 'concluido',
      updated_at = NOW()
  WHERE id = v_pedido_id;
  
  -- Registrar movimentação
  INSERT INTO pedidos_movimentacoes (
    pedido_id,
    etapa_origem,
    etapa_destino,
    realizado_por,
    observacoes
  ) VALUES (
    v_pedido_id,
    v_etapa_atual,
    'finalizado',
    auth.uid(),
    'Carregamento concluído automaticamente'
  );
END;
$function$;

-- Corrigir dados inconsistentes da ordem específica
UPDATE ordens_carregamento
SET status = 'concluida'
WHERE carregamento_concluido = TRUE AND status != 'concluida';

-- Corrigir qualquer pedido que tenha ordem concluída mas não avançou
-- (não vamos forçar avanço aqui, apenas corrigir status da ordem)