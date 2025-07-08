
-- Update all existing leads to have the default tag "Atendimento (Primeiro contato)"
UPDATE public.elisaportas_leads 
SET observacoes = '{"tags": ["atendimento_primeiro"]}'
WHERE observacoes IS NULL OR observacoes = '';

-- Update leads that have observacoes but no tags structure
UPDATE public.elisaportas_leads 
SET observacoes = '{"tags": ["atendimento_primeiro"]}'
WHERE observacoes IS NOT NULL 
  AND observacoes != '' 
  AND NOT (observacoes::jsonb ? 'tags');

-- Add new status for lost leads (7 = perdido)
-- This will be used when marking leads as lost
