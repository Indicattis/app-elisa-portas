ALTER TABLE public.gastos ADD COLUMN banco_id UUID REFERENCES public.bancos(id);
UPDATE public.gastos SET banco_id = (SELECT id FROM public.bancos LIMIT 1) WHERE banco_id IS NULL;
ALTER TABLE public.gastos ALTER COLUMN banco_id SET NOT NULL;