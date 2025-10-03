-- Add saldo column to instalacoes_cadastradas table
ALTER TABLE public.instalacoes_cadastradas
ADD COLUMN saldo numeric DEFAULT 0;