-- Adicionar coluna quantidade_itens em ordens_separacao
ALTER TABLE ordens_separacao 
ADD COLUMN IF NOT EXISTS quantidade_itens INTEGER;

-- Adicionar coluna quantidade_pedidos em ordens_qualidade (sempre 1)
ALTER TABLE ordens_qualidade 
ADD COLUMN IF NOT EXISTS quantidade_pedidos INTEGER DEFAULT 1;

-- Adicionar coluna quantidade_pedidos em ordens_carregamento (sempre 1)
ALTER TABLE ordens_carregamento 
ADD COLUMN IF NOT EXISTS quantidade_pedidos INTEGER DEFAULT 1;

-- Adicionar coluna metragem_quadrada em instalacoes
ALTER TABLE instalacoes 
ADD COLUMN IF NOT EXISTS metragem_quadrada DECIMAL(10,2);

-- Adicionar coluna metragem_quadrada em ordens_soldagem
ALTER TABLE ordens_soldagem 
ADD COLUMN IF NOT EXISTS metragem_quadrada DECIMAL(10,2);

-- Adicionar comentários para documentação
COMMENT ON COLUMN ordens_separacao.quantidade_itens IS 'Quantidade de itens/linhas na ordem de separação';
COMMENT ON COLUMN ordens_qualidade.quantidade_pedidos IS 'Quantidade de pedidos (sempre 1)';
COMMENT ON COLUMN ordens_carregamento.quantidade_pedidos IS 'Quantidade de pedidos (sempre 1)';
COMMENT ON COLUMN instalacoes.metragem_quadrada IS 'Total de m² (largura x altura) das portas do pedido';
COMMENT ON COLUMN ordens_soldagem.metragem_quadrada IS 'Total de m² (largura x altura) das portas do pedido';