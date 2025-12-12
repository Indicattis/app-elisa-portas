-- Adicionar coluna tipo (fixa/variável) e remover recorrente
ALTER TABLE public.tipos_custos 
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'fixa' CHECK (tipo IN ('fixa', 'variavel'));

-- Migrar dados: recorrente = true -> fixa, false -> variavel
UPDATE public.tipos_custos SET tipo = CASE WHEN recorrente = true THEN 'fixa' ELSE 'variavel' END;

-- Remover coluna recorrente
ALTER TABLE public.tipos_custos DROP COLUMN IF EXISTS recorrente;