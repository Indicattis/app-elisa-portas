
-- Corrigir o status_preenchimento do pedido 431949b4-cc11-4f8a-9383-263974a5ab20
UPDATE pedidos_producao 
SET status_preenchimento = 'preenchido' 
WHERE id = '431949b4-cc11-4f8a-9383-263974a5ab20';
