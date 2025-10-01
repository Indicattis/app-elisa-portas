-- Adicionar coluna categoria à tabela instalacoes_cadastradas
ALTER TABLE public.instalacoes_cadastradas 
ADD COLUMN categoria text NOT NULL DEFAULT 'instalacao' 
CHECK (categoria IN ('instalacao', 'entrega', 'correcao'));