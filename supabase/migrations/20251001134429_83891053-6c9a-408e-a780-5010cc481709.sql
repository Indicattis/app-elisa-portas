-- Add installer responsibility fields to instalacoes_cadastradas
CREATE TYPE tipo_instalacao_enum AS ENUM ('elisa', 'autorizados');

ALTER TABLE public.instalacoes_cadastradas
ADD COLUMN tipo_instalacao tipo_instalacao_enum,
ADD COLUMN responsavel_instalacao_id uuid,
ADD COLUMN responsavel_instalacao_nome text;