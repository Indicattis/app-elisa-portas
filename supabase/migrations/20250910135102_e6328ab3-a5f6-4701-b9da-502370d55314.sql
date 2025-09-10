-- Add new columns to autorizados_ratings table
ALTER TABLE autorizados_ratings 
ADD COLUMN data_evento date,
ADD COLUMN custo numeric DEFAULT 0;

-- Update the categoria enum to include new options and remove old ones
-- First, update existing records to use valid values
UPDATE autorizados_ratings 
SET categoria = 'instalacao' 
WHERE categoria IN ('suporte', 'atendimento');

-- Drop the existing type and create a new one with updated values
DROP TYPE IF EXISTS rating_categoria CASCADE;
CREATE TYPE rating_categoria AS ENUM ('instalacao', 'bos', 'visita_tecnica');

-- Update the column to use the new enum type
ALTER TABLE autorizados_ratings 
ALTER COLUMN categoria TYPE rating_categoria USING categoria::text::rating_categoria;

-- Make descricao field required (not null)
UPDATE autorizados_ratings SET descricao = 'Sem descrição' WHERE descricao IS NULL OR descricao = '';
ALTER TABLE autorizados_ratings ALTER COLUMN descricao SET NOT NULL;