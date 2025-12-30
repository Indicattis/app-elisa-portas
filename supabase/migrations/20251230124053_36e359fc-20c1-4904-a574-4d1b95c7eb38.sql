-- Adicionar coluna pedido_linha_id à tabela linhas_ordens
-- Esta coluna referencia a linha original do pedido que originou a linha da ordem

ALTER TABLE linhas_ordens 
ADD COLUMN IF NOT EXISTS pedido_linha_id uuid REFERENCES pedido_linhas(id);

-- Adicionar coluna indice_porta se não existir (usada na função)
ALTER TABLE linhas_ordens 
ADD COLUMN IF NOT EXISTS indice_porta integer;

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_linhas_ordens_pedido_linha_id 
ON linhas_ordens(pedido_linha_id);