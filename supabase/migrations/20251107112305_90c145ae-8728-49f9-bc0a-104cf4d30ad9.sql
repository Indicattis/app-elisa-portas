-- Função para sincronizar status da instalação com a última etapa do pedido
CREATE OR REPLACE FUNCTION sync_instalacao_status_from_pedido_etapa()
RETURNS TRIGGER AS $$
DECLARE
  ultima_etapa TEXT;
BEGIN
  -- Pegar a última etapa (mais recente) do pedido
  SELECT etapa INTO ultima_etapa
  FROM pedidos_etapas
  WHERE pedido_id = NEW.pedido_id
  ORDER BY 
    CASE 
      WHEN data_saida IS NOT NULL THEN data_saida
      ELSE data_entrada
    END DESC
  LIMIT 1;
  
  -- Atualizar status das instalações relacionadas ao pedido
  UPDATE instalacoes_cadastradas
  SET 
    status = CASE
      -- Se o pedido está aguardando instalação ou coleta, instalação fica pronta
      WHEN ultima_etapa IN ('aguardando_instalacao', 'aguardando_coleta') 
        THEN 'pronta_fabrica'
      -- Se o pedido já está finalizado e a instalação ainda não foi marcada como concluída
      WHEN ultima_etapa = 'finalizado' AND instalacao_concluida = false
        THEN 'pronta_fabrica'
      -- Qualquer outra etapa significa que ainda está em produção
      WHEN ultima_etapa IN ('aberto', 'em_producao', 'inspecao_qualidade', 'aguardando_pintura')
        THEN 'pendente_producao'
      -- Mantém o status atual se não se encaixar nas regras acima
      ELSE status
    END,
    updated_at = now()
  WHERE 
    pedido_id = NEW.pedido_id 
    AND instalacao_concluida = false  -- Não alterar instalações já finalizadas
    AND status != 'finalizada';  -- Não alterar instalações finalizadas manualmente
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_sync_instalacao_status_etapa ON pedidos_etapas;

-- Criar trigger para sincronizar status quando uma etapa for inserida ou atualizada
CREATE TRIGGER trigger_sync_instalacao_status_etapa
  AFTER INSERT OR UPDATE ON pedidos_etapas
  FOR EACH ROW
  EXECUTE FUNCTION sync_instalacao_status_from_pedido_etapa();

-- Atualizar status de todas as instalações existentes baseado na última etapa dos pedidos
WITH ultimas_etapas AS (
  SELECT DISTINCT ON (pedido_id) 
    pedido_id,
    etapa
  FROM pedidos_etapas
  ORDER BY 
    pedido_id,
    CASE 
      WHEN data_saida IS NOT NULL THEN data_saida
      ELSE data_entrada
    END DESC
)
UPDATE instalacoes_cadastradas ic
SET 
  status = CASE
    WHEN ue.etapa IN ('aguardando_instalacao', 'aguardando_coleta', 'finalizado') 
      THEN 'pronta_fabrica'
    WHEN ue.etapa IN ('aberto', 'em_producao', 'inspecao_qualidade', 'aguardando_pintura')
      THEN 'pendente_producao'
    ELSE ic.status
  END,
  updated_at = now()
FROM ultimas_etapas ue
WHERE 
  ic.pedido_id = ue.pedido_id 
  AND ic.instalacao_concluida = false
  AND ic.status != 'finalizada';