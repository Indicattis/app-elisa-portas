-- Remove the existing unique constraint on data field only
ALTER TABLE contador_vendas_dias DROP CONSTRAINT IF EXISTS contador_vendas_dias_data_key;

-- Add a composite unique constraint on data + atendente_id 
-- This allows multiple attendants to have sales on the same day
ALTER TABLE contador_vendas_dias ADD CONSTRAINT contador_vendas_dias_data_atendente_unique UNIQUE (data, atendente_id);