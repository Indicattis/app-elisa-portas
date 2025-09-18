-- Update the autorizado_etapa enum to reflect new stages
-- First, add the new enum value
ALTER TYPE autorizado_etapa ADD VALUE 'apresentacao_proposta';

-- Update existing records that have 'integracao' to 'apresentacao_proposta'
UPDATE autorizados SET etapa = 'apresentacao_proposta' WHERE etapa = 'integracao';

-- Update existing records that have 'treinamento_comercial' to 'apresentacao_proposta' (moving them to the first stage)
UPDATE autorizados SET etapa = 'apresentacao_proposta' WHERE etapa = 'treinamento_comercial';

-- Note: We cannot directly remove enum values in PostgreSQL, but we can update all references
-- The old enum values will remain in the type definition but won't be used