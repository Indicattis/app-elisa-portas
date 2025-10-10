-- Atualizar o href de Investimentos Marketing para a nova rota dedicada
UPDATE app_tabs 
SET href = '/dashboard/investimentos',
    updated_at = now()
WHERE key = 'config_investimentos' AND label = 'Investimentos Marketing';