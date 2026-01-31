-- Adicionar coluna setor na tabela estoque_conferencias
ALTER TABLE estoque_conferencias 
ADD COLUMN setor TEXT DEFAULT 'fabrica';