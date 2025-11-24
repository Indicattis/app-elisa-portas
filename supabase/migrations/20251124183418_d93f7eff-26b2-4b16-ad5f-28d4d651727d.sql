-- Função para sincronizar data_carregamento do pedido quando data_instalacao muda
CREATE OR REPLACE FUNCTION sync_data_carregamento_from_instalacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a data_instalacao foi alterada e existe pedido vinculado
  IF NEW.data_instalacao IS DISTINCT FROM OLD.data_instalacao 
     AND NEW.pedido_id IS NOT NULL THEN
    
    UPDATE pedidos_producao
    SET data_carregamento = NEW.data_instalacao,
        updated_at = NOW()
    WHERE id = NEW.pedido_id;
    
    RAISE LOG '[sync] Data carregamento atualizada para pedido %: %', 
      NEW.pedido_id, NEW.data_instalacao;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger em instalacoes_cadastradas para sincronização bidirecional
CREATE TRIGGER trigger_sync_data_carregamento
  AFTER INSERT OR UPDATE OF data_instalacao
  ON instalacoes_cadastradas
  FOR EACH ROW
  EXECUTE FUNCTION sync_data_carregamento_from_instalacao();

COMMENT ON FUNCTION sync_data_carregamento_from_instalacao() IS 'Sincroniza automaticamente a data de carregamento do pedido quando a data de instalação é alterada';
COMMENT ON TRIGGER trigger_sync_data_carregamento ON instalacoes_cadastradas IS 'Mantém data_carregamento do pedido sincronizada com data_instalacao';