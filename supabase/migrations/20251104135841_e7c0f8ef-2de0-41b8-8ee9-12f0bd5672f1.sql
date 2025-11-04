
-- Função para mapear etapa do pedido para status de instalação
CREATE OR REPLACE FUNCTION map_etapa_to_instalacao_status(etapa text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE etapa
    WHEN 'aberto' THEN 'pendente_producao'
    WHEN 'em_producao' THEN 'em_producao'
    WHEN 'inspecao_qualidade' THEN 'em_producao'
    WHEN 'aguardando_pintura' THEN 'em_producao'
    WHEN 'aguardando_instalacao' THEN 'pronta_fabrica'
    WHEN 'finalizado' THEN 'finalizada'
    ELSE 'pendente_producao'
  END;
END;
$$;

-- Função para sincronizar status de instalações com etapas dos pedidos
CREATE OR REPLACE FUNCTION sync_instalacao_status_from_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas atualizar se houver uma instalação associada a este pedido
  IF EXISTS (SELECT 1 FROM instalacoes_cadastradas WHERE pedido_id = NEW.id) THEN
    -- Atualizar o status da instalação usando o mapeamento correto
    UPDATE instalacoes_cadastradas 
    SET status = map_etapa_to_instalacao_status(NEW.etapa_atual)
    WHERE pedido_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar automaticamente quando pedido mudar de etapa
DROP TRIGGER IF EXISTS sync_instalacao_status_trigger ON pedidos_producao;
CREATE TRIGGER sync_instalacao_status_trigger
  AFTER UPDATE OF etapa_atual ON pedidos_producao
  FOR EACH ROW
  WHEN (OLD.etapa_atual IS DISTINCT FROM NEW.etapa_atual)
  EXECUTE FUNCTION sync_instalacao_status_from_pedido();

-- Sincronizar todos os registros existentes
UPDATE instalacoes_cadastradas ic
SET status = map_etapa_to_instalacao_status(pp.etapa_atual)
FROM pedidos_producao pp
WHERE ic.pedido_id = pp.id;
