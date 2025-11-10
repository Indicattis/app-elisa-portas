-- Adicionar entrada para Ordens de Produção no menu
INSERT INTO app_tabs (key, label, href, icon, tab_group, sort_order, active, permission)
VALUES 
  ('ordens', 'Ordens de Produção', '/dashboard/ordens', 'FileText', 'fabrica', 25, true, 'producao')
ON CONFLICT (key) DO UPDATE
SET 
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  tab_group = EXCLUDED.tab_group,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  permission = EXCLUDED.permission;