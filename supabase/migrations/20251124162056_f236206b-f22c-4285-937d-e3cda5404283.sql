-- Adicionar colunas para arquivamento de pedidos
ALTER TABLE pedidos_producao 
ADD COLUMN arquivado boolean NOT NULL DEFAULT false,
ADD COLUMN data_arquivamento timestamp with time zone,
ADD COLUMN arquivado_por uuid REFERENCES auth.users(id);

-- Criar índice para melhorar performance nas consultas
CREATE INDEX idx_pedidos_producao_arquivado ON pedidos_producao(arquivado);

-- Comentários para documentação
COMMENT ON COLUMN pedidos_producao.arquivado IS 'Indica se o pedido foi arquivado e movido para o histórico';
COMMENT ON COLUMN pedidos_producao.data_arquivamento IS 'Data e hora em que o pedido foi arquivado';
COMMENT ON COLUMN pedidos_producao.arquivado_por IS 'ID do usuário que arquivou o pedido';