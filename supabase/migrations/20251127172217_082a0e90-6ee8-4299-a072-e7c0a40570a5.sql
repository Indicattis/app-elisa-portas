-- Adicionar rota de Notas Fiscais na sidebar
INSERT INTO app_routes (
  key,
  label,
  path,
  icon,
  parent_key,
  "group",
  interface,
  description,
  sort_order,
  active
) VALUES (
  'notas_fiscais',
  'Notas Fiscais',
  '/dashboard/administrativo/financeiro/notas-fiscais',
  'FileText',
  'financeiro_home',
  'administrativo',
  'admin',
  'Gestão de notas fiscais de entrada e saída',
  50,
  true
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  "group" = EXCLUDED."group",
  interface = EXCLUDED.interface,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;