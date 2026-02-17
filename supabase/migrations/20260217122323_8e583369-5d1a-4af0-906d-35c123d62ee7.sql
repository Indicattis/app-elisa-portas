
-- Add prioridade_gestao column to neo_instalacoes
ALTER TABLE public.neo_instalacoes ADD COLUMN prioridade_gestao integer NOT NULL DEFAULT 0;

-- Add prioridade_gestao column to neo_correcoes
ALTER TABLE public.neo_correcoes ADD COLUMN prioridade_gestao integer NOT NULL DEFAULT 0;
