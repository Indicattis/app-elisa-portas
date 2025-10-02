-- 1. Primeiro remover a foreign key constraint
ALTER TABLE public.instalacoes_cadastradas
DROP CONSTRAINT IF EXISTS instalacoes_cadastradas_created_by_fkey;