-- Reverter a ordem OSE-2026-0026 para status pausada (não concluída)
-- O status correto deve ser 'pendente' ou 'em_andamento', não 'concluido'

UPDATE public.ordens_separacao 
SET 
  status = 'pendente',
  pausada = true, 
  pausada_em = '2026-01-21 15:11:07.917657+00',
  justificativa_pausa = 'Falta de motor 800AC',
  data_conclusao = NULL
WHERE numero_ordem = 'OSE-2026-0026';