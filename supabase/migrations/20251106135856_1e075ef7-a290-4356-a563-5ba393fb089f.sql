-- Adicionar campos para sistema de backlog na tabela pedidos_producao
ALTER TABLE pedidos_producao
ADD COLUMN IF NOT EXISTS em_backlog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_backlog TEXT,
ADD COLUMN IF NOT EXISTS etapa_origem_backlog TEXT;

-- Criar índice para melhorar performance de queries com backlog
CREATE INDEX IF NOT EXISTS idx_pedidos_em_backlog ON pedidos_producao(em_backlog) WHERE em_backlog = true;

-- Função para retroceder pedido para qualquer etapa (backlog)
CREATE OR REPLACE FUNCTION retroceder_pedido_para_etapa(
  p_pedido_id uuid,
  p_etapa_destino text,
  p_motivo_backlog text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_etapa_atual text;
  v_max_prioridade integer;
BEGIN
  -- Obter etapa atual
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  -- Obter maior prioridade da etapa destino para colocar este pedido no topo
  SELECT COALESCE(MAX(prioridade_etapa), 0) INTO v_max_prioridade
  FROM pedidos_producao
  WHERE etapa_atual = p_etapa_destino;

  -- Fechar etapa atual
  UPDATE pedidos_etapas
  SET data_saida = NOW()
  WHERE pedido_id = p_pedido_id
  AND data_saida IS NULL;

  -- Criar nova etapa destino
  INSERT INTO pedidos_etapas (pedido_id, etapa, checkboxes, data_entrada)
  SELECT 
    p_pedido_id,
    p_etapa_destino::text,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'check_backlog_resolvido',
        'label', 'Problema resolvido - pronto para avançar',
        'checked', false,
        'required', true
      )
    ),
    NOW();

  -- Atualizar pedido com backlog
  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino::text,
    em_backlog = true,
    motivo_backlog = p_motivo_backlog,
    etapa_origem_backlog = v_etapa_atual,
    prioridade_etapa = v_max_prioridade + 1000, -- Garantir que fique no topo
    updated_at = NOW()
  WHERE id = p_pedido_id;

END;
$$;