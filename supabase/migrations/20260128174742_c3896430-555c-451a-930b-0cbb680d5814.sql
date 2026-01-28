-- Corrigir ordem OSE-2026-0026 que está com pausada=true mas status=concluido
-- Uma ordem concluída não pode estar pausada

UPDATE public.ordens_separacao 
SET 
  pausada = false, 
  pausada_em = NULL, 
  justificativa_pausa = NULL, 
  linha_problema_id = NULL
WHERE numero_ordem = 'OSE-2026-0026' AND status = 'concluido';

-- Também corrigir qualquer outra ordem que tenha a mesma inconsistência
UPDATE public.ordens_separacao 
SET 
  pausada = false, 
  pausada_em = NULL, 
  justificativa_pausa = NULL, 
  linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;

UPDATE public.ordens_soldagem 
SET 
  pausada = false, 
  pausada_em = NULL, 
  justificativa_pausa = NULL, 
  linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;

UPDATE public.ordens_perfiladeira 
SET 
  pausada = false, 
  pausada_em = NULL, 
  justificativa_pausa = NULL, 
  linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;