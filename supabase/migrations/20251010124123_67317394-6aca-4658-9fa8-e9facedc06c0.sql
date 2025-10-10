-- Atualizar o href de Canais de Aquisição para a nova rota dedicada
UPDATE app_tabs 
SET href = '/dashboard/canais-aquisicao',
    updated_at = now()
WHERE key = 'config_canais' AND label = 'Canais de Aquisição';