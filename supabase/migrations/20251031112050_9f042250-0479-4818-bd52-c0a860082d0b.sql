-- Adicionar coluna produto_venda_id para vincular linhas às portas específicas
ALTER TABLE pedido_linhas 
ADD COLUMN produto_venda_id UUID REFERENCES produtos_vendas(id) ON DELETE CASCADE;

-- Índice para performance
CREATE INDEX idx_pedido_linhas_produto_venda ON pedido_linhas(produto_venda_id);

-- Comentário explicativo
COMMENT ON COLUMN pedido_linhas.produto_venda_id IS 'Referência ao produto (porta) da venda ao qual esta linha pertence';

-- Deletar todas as linhas existentes (limpeza para novo sistema)
DELETE FROM pedido_linhas;