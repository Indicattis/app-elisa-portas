
-- Add responsavel column
ALTER TABLE public.veiculos ADD COLUMN IF NOT EXISTS responsavel TEXT;

-- First drop old constraint
ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS veiculos_status_check;

-- Update existing status values to new ones
UPDATE public.veiculos SET status = 'rodando' WHERE status IN ('pronto', 'em_uso');
UPDATE public.veiculos SET status = 'parado' WHERE status IN ('atencao', 'critico');

-- Add new constraint
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_status_check CHECK (status IN ('rodando', 'mecanico', 'parado'));
