-- Add missing fields to ordens_carregamento table
ALTER TABLE ordens_carregamento
ADD COLUMN IF NOT EXISTS responsavel_tipo text,
ADD COLUMN IF NOT EXISTS observacoes text;