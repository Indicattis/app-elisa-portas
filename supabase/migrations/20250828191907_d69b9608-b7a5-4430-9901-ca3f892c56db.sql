-- Check and remove any remaining problematic unique constraints
ALTER TABLE contador_vendas_dias DROP CONSTRAINT IF EXISTS unique_dia_atendente;

-- Ensure the correct constraint exists
ALTER TABLE contador_vendas_dias DROP CONSTRAINT IF EXISTS contador_vendas_dias_data_atendente_unique;
ALTER TABLE contador_vendas_dias ADD CONSTRAINT contador_vendas_dias_data_atendente_unique UNIQUE (data, atendente_id);