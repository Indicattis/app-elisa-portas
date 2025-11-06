-- Remove o trigger que cria pedidos automaticamente após inserir vendas
DROP TRIGGER IF EXISTS trigger_auto_create_pedido_aberto ON vendas;

-- Remove a função associada ao trigger
DROP FUNCTION IF EXISTS auto_create_pedido_aberto();