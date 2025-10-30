-- Adicionar colunas de largura e altura na tabela pedido_linhas
ALTER TABLE pedido_linhas 
ADD COLUMN largura NUMERIC(10,2),
ADD COLUMN altura NUMERIC(10,2);

-- Adicionar constraints de validação
ALTER TABLE pedido_linhas
ADD CONSTRAINT check_largura_positiva CHECK (largura IS NULL OR largura > 0),
ADD CONSTRAINT check_altura_positiva CHECK (altura IS NULL OR altura > 0);

-- Índices para performance
CREATE INDEX idx_pedido_linhas_largura ON pedido_linhas(largura) WHERE largura IS NOT NULL;
CREATE INDEX idx_pedido_linhas_altura ON pedido_linhas(altura) WHERE altura IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN pedido_linhas.largura IS 'Largura do produto em metros';
COMMENT ON COLUMN pedido_linhas.altura IS 'Altura do produto em metros';