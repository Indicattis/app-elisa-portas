-- Permitir valores NULL na coluna quantidade_conferida
-- NULL = item ainda não conferido
-- Número = quantidade verificada pelo conferente

ALTER TABLE estoque_conferencia_itens 
ALTER COLUMN quantidade_conferida DROP NOT NULL;