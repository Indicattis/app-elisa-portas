-- Add data_instalacao and status columns to instalacoes_cadastradas
ALTER TABLE instalacoes_cadastradas
ADD COLUMN data_instalacao date,
ADD COLUMN status text NOT NULL DEFAULT 'pendente_producao';

-- Add check constraint for valid status values
ALTER TABLE instalacoes_cadastradas
ADD CONSTRAINT valid_status CHECK (status IN ('pendente_producao', 'pronta_fabrica', 'finalizada'));