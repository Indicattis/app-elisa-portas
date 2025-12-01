-- Adicionar coluna titulo na tabela empresas_emissoras
ALTER TABLE public.empresas_emissoras 
ADD COLUMN titulo text;

-- Atualizar empresas existentes para ter o nome como título padrão
UPDATE public.empresas_emissoras 
SET titulo = nome 
WHERE titulo IS NULL;