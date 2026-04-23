ALTER TABLE public.ordens_embalagem
  ADD COLUMN IF NOT EXISTS pausada boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pausada_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS justificativa_pausa text,
  ADD COLUMN IF NOT EXISTS tempo_acumulado_segundos integer DEFAULT 0;