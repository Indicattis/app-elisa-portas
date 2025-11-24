-- Add archive columns to pedidos_producao table
ALTER TABLE pedidos_producao
ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS data_arquivamento timestamp with time zone,
ADD COLUMN IF NOT EXISTS arquivado_por uuid;

-- Create index for better query performance on archived orders
CREATE INDEX IF NOT EXISTS idx_pedidos_producao_arquivado ON pedidos_producao(arquivado);

-- Add comment for documentation
COMMENT ON COLUMN pedidos_producao.arquivado IS 'Indica se o pedido foi arquivado';
COMMENT ON COLUMN pedidos_producao.data_arquivamento IS 'Data e hora em que o pedido foi arquivado';
COMMENT ON COLUMN pedidos_producao.arquivado_por IS 'ID do usuário que arquivou o pedido';