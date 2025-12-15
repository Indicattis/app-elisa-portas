-- Adicionar campo indice_porta nas tabelas para distinguir múltiplas portas do mesmo produto
ALTER TABLE pedido_linhas ADD COLUMN IF NOT EXISTS indice_porta INTEGER DEFAULT 0;
ALTER TABLE pedido_porta_observacoes ADD COLUMN IF NOT EXISTS indice_porta INTEGER DEFAULT 0;

-- Remover constraint antiga se existir e criar nova com indice_porta
ALTER TABLE pedido_porta_observacoes DROP CONSTRAINT IF EXISTS pedido_porta_observacoes_pedido_id_produto_venda_id_key;
ALTER TABLE pedido_porta_observacoes ADD CONSTRAINT pedido_porta_observacoes_pedido_produto_indice_key 
  UNIQUE (pedido_id, produto_venda_id, indice_porta);