-- Adicionar coluna tipo_cliente na tabela clientes
ALTER TABLE clientes ADD COLUMN tipo_cliente text;

-- Adicionar constraint para validar valores permitidos
ALTER TABLE clientes ADD CONSTRAINT clientes_tipo_cliente_check 
  CHECK (tipo_cliente IN ('CE', 'CR') OR tipo_cliente IS NULL);

-- Comentário para documentação
COMMENT ON COLUMN clientes.tipo_cliente IS 'Tipo de cliente: CE (Cliente Esporádico) ou CR (Cliente Recorrente)';