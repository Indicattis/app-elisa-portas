-- Adicionar item "Admin" na sidebar
INSERT INTO public.app_tabs (
  key,
  label,
  href,
  tab_group,
  icon,
  parent_key,
  sort_order,
  active,
  permission
) VALUES (
  'admin',
  'Admin',
  '/admin',
  'sidebar',
  'Shield',
  'administrativo',
  99,
  true,
  'configuracoes'
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  permission = EXCLUDED.permission;