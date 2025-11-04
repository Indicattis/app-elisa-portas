-- Atualizar labels e ordem dos grupos principais da sidebar
UPDATE app_tabs 
SET label = 'Direção', sort_order = 0
WHERE key = 'direcao';

UPDATE app_tabs 
SET label = 'Marketing', sort_order = 1
WHERE key = 'marketing_group';

UPDATE app_tabs 
SET label = 'Vendas', sort_order = 2
WHERE key = 'vendas_group';

UPDATE app_tabs 
SET label = 'Fábrica', sort_order = 3
WHERE key = 'fabrica';

UPDATE app_tabs 
SET label = 'Instalações', sort_order = 4
WHERE key = 'instalacoes_group';

UPDATE app_tabs 
SET label = 'Logística', sort_order = 5
WHERE key = 'logistica_group';

UPDATE app_tabs 
SET label = 'Administrativo', sort_order = 6
WHERE key = 'administrativo';

-- Mover DP/RH para dentro do grupo Administrativo
UPDATE app_tabs 
SET label = 'DP/RH', parent_key = 'administrativo', sort_order = 10
WHERE key = 'dp-rh';

-- Desativar o grupo rh_group duplicado
UPDATE app_tabs 
SET active = false
WHERE key = 'rh_group';