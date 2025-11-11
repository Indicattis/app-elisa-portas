-- Adicionar rota de gerenciamento de cargos na interface admin
INSERT INTO app_routes (key, path, label, description, icon, interface, parent_key, sort_order, active)
VALUES (
  'admin_roles',
  '/admin/roles',
  'Cargos',
  'Gerenciamento de cargos do sistema',
  'Briefcase',
  'admin',
  'admin',
  4,
  true
)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  interface = EXCLUDED.interface,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;