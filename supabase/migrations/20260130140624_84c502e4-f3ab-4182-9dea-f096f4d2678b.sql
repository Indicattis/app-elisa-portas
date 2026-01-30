-- Adicionar coluna quantidade_maxima na tabela estoque
ALTER TABLE estoque ADD COLUMN quantidade_maxima integer DEFAULT 0;