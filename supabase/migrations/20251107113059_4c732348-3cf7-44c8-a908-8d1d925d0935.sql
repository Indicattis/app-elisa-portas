-- Função para sincronizar etapa_atual do pedido com a última etapa de pedidos_etapas
CREATE OR REPLACE FUNCTION sync_pedido_etapa_atual()
RETURNS TRIGGER AS $$
DECLARE
  v_ultima_etapa TEXT;
BEGIN
  -- Buscar a última etapa do pedido (etapa com data_saida NULL ou mais recente)
  SELECT etapa INTO v_ultima_etapa
  FROM pedidos_etapas
  WHERE pedido_id = NEW.pedido_id
  ORDER BY 
    CASE 
      WHEN data_saida IS NULL THEN data_entrada
      ELSE data_saida
    END DESC
  LIMIT 1;
  
  -- Atualizar o campo etapa_atual em pedidos_producao
  UPDATE pedidos_producao
  SET 
    etapa_atual = v_ultima_etapa,
    updated_at = now()
  WHERE id = NEW.pedido_id
    AND (etapa_atual IS DISTINCT FROM v_ultima_etapa); -- Só atualiza se mudou
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_sync_pedido_etapa_atual ON pedidos_etapas;

-- Criar trigger para sincronizar etapa_atual quando etapas forem inseridas ou atualizadas
CREATE TRIGGER trigger_sync_pedido_etapa_atual
  AFTER INSERT OR UPDATE ON pedidos_etapas
  FOR EACH ROW
  EXECUTE FUNCTION sync_pedido_etapa_atual();

-- Sincronizar todos os pedidos existentes com suas últimas etapas
WITH ultimas_etapas AS (
  SELECT DISTINCT ON (pedido_id) 
    pedido_id,
    etapa
  FROM pedidos_etapas
  ORDER BY 
    pedido_id,
    CASE 
      WHEN data_saida IS NULL THEN data_entrada
      ELSE data_saida
    END DESC
)
UPDATE pedidos_producao pp
SET 
  etapa_atual = ue.etapa,
  updated_at = now()
FROM ultimas_etapas ue
WHERE pp.id = ue.pedido_id
  AND pp.etapa_atual IS DISTINCT FROM ue.etapa;