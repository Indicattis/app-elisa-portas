-- Migração para Focus NFe API
-- Renomear nfeio_id para api_id (nome mais genérico)
ALTER TABLE notas_fiscais RENAME COLUMN nfeio_id TO api_id;

-- Adicionar coluna para armazenar a referência única usada na Focus NFe
ALTER TABLE notas_fiscais ADD COLUMN IF NOT EXISTS ref_externa TEXT;