-- Desativar rota antiga de produção
UPDATE app_tabs SET active = false WHERE key = 'producao' AND parent_key = 'fabrica';

-- Criar grupo "Produção" e subitens
INSERT INTO app_tabs (key, label, href, icon, tab_group, parent_key, sort_order, active, permission) 
VALUES 
  ('producao_group', 'Produção', '#', 'Factory', 'sidebar', 'fabrica', 3, true, 'producao'),
  ('producao_solda', 'Solda', '/dashboard/producao/solda', 'Flame', 'sidebar', 'producao_group', 1, true, 'producao'),
  ('producao_perfiladeira', 'Perfiladeira', '/dashboard/producao/perfiladeira', 'Settings', 'sidebar', 'producao_group', 2, true, 'producao'),
  ('producao_separacao', 'Separação', '/dashboard/producao/separacao', 'Package', 'sidebar', 'producao_group', 3, true, 'producao')
ON CONFLICT (key) DO UPDATE SET 
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  permission = EXCLUDED.permission;