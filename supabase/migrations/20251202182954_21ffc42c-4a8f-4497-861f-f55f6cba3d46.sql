-- 1. Atualizar registros existentes de 'retrocesso' para 'backlog'
UPDATE public.pedidos_movimentacoes 
SET teor = 'backlog' 
WHERE teor = 'retrocesso';

-- 2. Remover a constraint antiga e adicionar nova sem 'retrocesso'
ALTER TABLE public.pedidos_movimentacoes 
DROP CONSTRAINT IF EXISTS pedidos_movimentacoes_teor_check;

ALTER TABLE public.pedidos_movimentacoes 
ADD CONSTRAINT pedidos_movimentacoes_teor_check 
CHECK (teor IN ('avanco', 'backlog', 'reorganizacao', 'criacao'));

-- 3. Recriar a função retroceder_pedido_para_etapa usando 'backlog' ao invés de 'retrocesso'
CREATE OR REPLACE FUNCTION public.retroceder_pedido_para_etapa(
  p_pedido_id UUID,
  p_etapa_destino TEXT,
  p_motivo_backlog TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_etapa_atual TEXT;
BEGIN
  -- Buscar etapa atual do pedido
  SELECT etapa INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  IF v_etapa_atual IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- Atualizar pedido para a etapa de destino e marcar como backlog
  UPDATE pedidos_producao
  SET 
    etapa = p_etapa_destino,
    em_backlog = true,
    motivo_backlog = p_motivo_backlog,
    data_backlog = NOW(),
    updated_at = NOW()
  WHERE id = p_pedido_id;

  -- Registrar movimentação como 'backlog' (não mais 'retrocesso')
  INSERT INTO pedidos_movimentacoes (
    pedido_id,
    etapa_origem,
    etapa_destino,
    teor,
    descricao,
    user_id,
    data_hora
  ) VALUES (
    p_pedido_id,
    v_etapa_atual,
    p_etapa_destino,
    'backlog',
    'BACKLOG: ' || p_motivo_backlog,
    p_user_id,
    NOW()
  );
END;
$$;