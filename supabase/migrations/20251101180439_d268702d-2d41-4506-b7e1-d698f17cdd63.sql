-- Remover constraint antiga
ALTER TABLE public.instalacoes_cadastradas 
DROP CONSTRAINT IF EXISTS valid_status;

-- Adicionar constraint atualizada incluindo 'em_producao'
ALTER TABLE public.instalacoes_cadastradas
ADD CONSTRAINT valid_status 
CHECK (status = ANY (ARRAY[
  'pendente_producao'::text, 
  'em_producao'::text,
  'pronta_fabrica'::text, 
  'finalizada'::text
]));