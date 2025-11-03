-- Listar todos os triggers relacionados a instalacoes_cadastradas
SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    pg_get_triggerdef(pg_trigger.oid) AS trigger_definition
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE pg_class.relname = 'instalacoes_cadastradas'
ORDER BY tgname;

-- Ver o código da função criar_logistica_ao_avancar_producao se existir
SELECT 
    proname AS function_name,
    pg_get_functiondef(pg_proc.oid) AS function_definition
FROM pg_proc
WHERE proname LIKE '%logistica%' OR proname LIKE '%instalacao%'
ORDER BY proname;