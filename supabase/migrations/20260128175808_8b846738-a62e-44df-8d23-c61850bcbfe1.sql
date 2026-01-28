-- Corrigir ordem OSE-2026-0026 que está incorretamente marcada como historico
UPDATE public.ordens_separacao 
SET historico = false
WHERE numero_ordem = 'OSE-2026-0026';