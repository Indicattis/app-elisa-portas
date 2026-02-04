-- Corrigir interface da rota cronograma-producao para 'padrao'
UPDATE app_routes 
SET interface = 'padrao', parent_key = 'fabrica_hub'
WHERE key = 'fabrica_cronograma_producao';