-- Adicionar campos de backlog e prioridade nas tabelas de ordens
ALTER TABLE ordens_soldagem
ADD COLUMN IF NOT EXISTS em_backlog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0;

ALTER TABLE ordens_perfiladeira
ADD COLUMN IF NOT EXISTS em_backlog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0;

ALTER TABLE ordens_separacao
ADD COLUMN IF NOT EXISTS em_backlog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0;

ALTER TABLE ordens_qualidade
ADD COLUMN IF NOT EXISTS em_backlog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0;

ALTER TABLE ordens_pintura
ADD COLUMN IF NOT EXISTS em_backlog BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 0;

-- Função para sincronizar prioridade e backlog das ordens com o pedido
CREATE OR REPLACE FUNCTION sync_ordens_prioridade_backlog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar todas as ordens do pedido com a nova prioridade e status de backlog
  UPDATE ordens_soldagem 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = NEW.em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_perfiladeira 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = NEW.em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_separacao 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = NEW.em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_qualidade 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = NEW.em_backlog
  WHERE pedido_id = NEW.id;

  UPDATE ordens_pintura 
  SET prioridade = NEW.prioridade_etapa,
      em_backlog = NEW.em_backlog
  WHERE pedido_id = NEW.id;

  RETURN NEW;
END;
$$;

-- Trigger para sincronizar automaticamente
DROP TRIGGER IF EXISTS trigger_sync_ordens_prioridade ON pedidos_producao;
CREATE TRIGGER trigger_sync_ordens_prioridade
AFTER UPDATE OF prioridade_etapa, em_backlog ON pedidos_producao
FOR EACH ROW
EXECUTE FUNCTION sync_ordens_prioridade_backlog();

-- Atualizar função de retroceder pedido para marcar ordens como backlog
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
  SELECT etapa_atual INTO v_etapa_atual
  FROM pedidos_producao
  WHERE id = p_pedido_id;

  SELECT COALESCE(MAX(prioridade_etapa), 0) INTO v_max_prioridade
  FROM pedidos_producao
  WHERE etapa_atual = p_etapa_destino;

  UPDATE pedidos_etapas
  SET data_saida = NOW()
  WHERE pedido_id = p_pedido_id
  AND data_saida IS NULL;

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

  UPDATE pedidos_producao
  SET 
    etapa_atual = p_etapa_destino::text,
    em_backlog = true,
    motivo_backlog = p_motivo_backlog,
    etapa_origem_backlog = v_etapa_atual,
    prioridade_etapa = v_max_prioridade + 1000,
    updated_at = NOW()
  WHERE id = p_pedido_id;

  -- Marcar ordens relacionadas à etapa como backlog com prioridade máxima
  IF p_etapa_destino = 'em_producao' THEN
    UPDATE ordens_soldagem SET em_backlog = true, prioridade = v_max_prioridade + 1000 WHERE pedido_id = p_pedido_id;
    UPDATE ordens_perfiladeira SET em_backlog = true, prioridade = v_max_prioridade + 1000 WHERE pedido_id = p_pedido_id;
    UPDATE ordens_separacao SET em_backlog = true, prioridade = v_max_prioridade + 1000 WHERE pedido_id = p_pedido_id;
  ELSIF p_etapa_destino = 'inspecao_qualidade' THEN
    UPDATE ordens_qualidade SET em_backlog = true, prioridade = v_max_prioridade + 1000 WHERE pedido_id = p_pedido_id;
  ELSIF p_etapa_destino = 'aguardando_pintura' THEN
    UPDATE ordens_pintura SET em_backlog = true, prioridade = v_max_prioridade + 1000 WHERE pedido_id = p_pedido_id;
  END IF;
END;
$$;