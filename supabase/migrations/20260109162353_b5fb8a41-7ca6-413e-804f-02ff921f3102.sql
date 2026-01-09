-- Adicionar colunas para sistema de pausa/aviso de falta na tabela ordens_separacao
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS pausada BOOLEAN DEFAULT FALSE;
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS pausada_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS justificativa_pausa TEXT;
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS tempo_acumulado_segundos INTEGER DEFAULT 0;