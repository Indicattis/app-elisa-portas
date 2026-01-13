-- Add pausada columns to ordens_soldagem, ordens_perfiladeira, ordens_qualidade
-- (ordens_separacao already has these columns)

ALTER TABLE ordens_soldagem 
ADD COLUMN IF NOT EXISTS pausada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pausada_em timestamptz,
ADD COLUMN IF NOT EXISTS justificativa_pausa text,
ADD COLUMN IF NOT EXISTS tempo_acumulado_segundos integer DEFAULT 0;

ALTER TABLE ordens_perfiladeira 
ADD COLUMN IF NOT EXISTS pausada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pausada_em timestamptz,
ADD COLUMN IF NOT EXISTS justificativa_pausa text,
ADD COLUMN IF NOT EXISTS tempo_acumulado_segundos integer DEFAULT 0;

ALTER TABLE ordens_qualidade 
ADD COLUMN IF NOT EXISTS pausada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pausada_em timestamptz,
ADD COLUMN IF NOT EXISTS justificativa_pausa text,
ADD COLUMN IF NOT EXISTS tempo_acumulado_segundos integer DEFAULT 0;