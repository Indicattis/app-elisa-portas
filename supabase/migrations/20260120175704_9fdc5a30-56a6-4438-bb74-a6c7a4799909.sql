-- Remover constraint que impede linhas duplicadas por pedido_linha_id
-- Cada tipo de ordem (perfiladeira, soldagem, pintura) pode ter sua própria linha
DROP INDEX IF EXISTS idx_linhas_ordens_pedido_linha_unique;

-- Criar índice composto que permite o mesmo pedido_linha_id em diferentes ordens
CREATE UNIQUE INDEX idx_linhas_ordens_ordem_pedido_linha_unique 
ON linhas_ordens (ordem_id, pedido_linha_id) 
WHERE pedido_linha_id IS NOT NULL;