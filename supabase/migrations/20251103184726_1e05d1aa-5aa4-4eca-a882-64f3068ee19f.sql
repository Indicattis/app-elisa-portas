-- Criar função para excluir entrega quando pedido retrocede para aberto
CREATE OR REPLACE FUNCTION excluir_entrega_ao_retroceder_pedido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se o pedido foi retrocedido para 'aberto' (estava em outra etapa antes)
  IF NEW.etapa_atual = 'aberto' AND OLD.etapa_atual IS NOT NULL AND OLD.etapa_atual != 'aberto' THEN
    -- Excluir entrega associada ao pedido
    DELETE FROM entregas WHERE pedido_id = NEW.id;
    
    RAISE LOG '[excluir_entrega_ao_retroceder_pedido] Entrega excluída para pedido: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_excluir_entrega_ao_retroceder ON pedidos_producao;
CREATE TRIGGER trigger_excluir_entrega_ao_retroceder
AFTER UPDATE OF etapa_atual ON pedidos_producao
FOR EACH ROW
EXECUTE FUNCTION excluir_entrega_ao_retroceder_pedido();