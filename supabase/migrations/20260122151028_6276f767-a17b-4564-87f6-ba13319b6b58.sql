-- Remover a constraint atual que bloqueia exclusão
ALTER TABLE linhas_ordens 
DROP CONSTRAINT IF EXISTS linhas_ordens_pedido_linha_id_fkey;

-- Recriar com ON DELETE SET NULL
-- Quando uma pedido_linha for excluída, apenas anula a referência em linhas_ordens
-- Isso mantém o histórico das ordens de produção intacto
ALTER TABLE linhas_ordens 
ADD CONSTRAINT linhas_ordens_pedido_linha_id_fkey 
FOREIGN KEY (pedido_linha_id) 
REFERENCES pedido_linhas(id) 
ON DELETE SET NULL;