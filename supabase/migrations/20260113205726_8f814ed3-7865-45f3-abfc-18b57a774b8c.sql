-- 1. Definir todos os clientes como CE (padrão)
UPDATE clientes SET tipo_cliente = 'CE' WHERE tipo_cliente IS NULL;

-- 2. Definir como CR os clientes com 3+ vendas (fidelizados)
UPDATE clientes 
SET tipo_cliente = 'CR' 
WHERE id IN (
  SELECT cliente_id 
  FROM vendas 
  WHERE cliente_id IS NOT NULL 
  GROUP BY cliente_id 
  HAVING COUNT(*) >= 3
);

-- 3. Definir como padrão CE para novos clientes (se não tiver valor)
ALTER TABLE clientes ALTER COLUMN tipo_cliente SET DEFAULT 'CE';