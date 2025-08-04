-- Remove a coluna status_atendimento e suas dependências
ALTER TABLE public.elisaportas_leads DROP COLUMN IF EXISTS status_atendimento;

-- Remove funções que dependiam do status_atendimento
DROP FUNCTION IF EXISTS public.iniciar_atendimento(uuid);
DROP FUNCTION IF EXISTS public.cancel_lead_attendance(uuid);
DROP FUNCTION IF EXISTS public.pause_lead_attendance(uuid);
DROP FUNCTION IF EXISTS public.finalizar_venda(uuid, numeric, text, text);

-- Remove trigger que dependia do status_atendimento
DROP TRIGGER IF EXISTS update_lead_tag_on_status_change ON public.elisaportas_leads;
DROP FUNCTION IF EXISTS public.update_lead_tag_on_status_change();