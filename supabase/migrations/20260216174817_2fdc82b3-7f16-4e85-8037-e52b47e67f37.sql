
ALTER TABLE public.neo_instalacoes ADD COLUMN IF NOT EXISTS valor_total NUMERIC DEFAULT 0;
ALTER TABLE public.neo_instalacoes ADD COLUMN IF NOT EXISTS valor_a_receber NUMERIC DEFAULT 0;

ALTER TABLE public.neo_correcoes ADD COLUMN IF NOT EXISTS valor_total NUMERIC DEFAULT 0;
ALTER TABLE public.neo_correcoes ADD COLUMN IF NOT EXISTS valor_a_receber NUMERIC DEFAULT 0;
