-- Ativar a aba Marketing na sidebar
UPDATE app_tabs
SET active = true
WHERE key = 'marketing';

-- Mover Canais de Aquisição para a sidebar como filho de Marketing
UPDATE app_tabs
SET 
  tab_group = 'sidebar',
  parent_key = 'marketing_group',
  href = '/dashboard/marketing#canais',
  sort_order = 2
WHERE key = 'config_canais';

-- Mover Investimentos para a sidebar como filho de Marketing
UPDATE app_tabs
SET 
  tab_group = 'sidebar',
  parent_key = 'marketing_group',
  href = '/dashboard/marketing#investimentos',
  sort_order = 3
WHERE key = 'config_investimentos';