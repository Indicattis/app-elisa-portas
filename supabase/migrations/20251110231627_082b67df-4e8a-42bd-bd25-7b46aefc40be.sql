-- Adicionar item "Ordens de Produção" na sidebar dentro do grupo "Fábrica"
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
  'ordens_producao',
  'Ordens de Produção',
  '/dashboard/ordens',
  'sidebar',
  'FileText',
  'fabrica',
  1,
  true,
  'producao'
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  permission = EXCLUDED.permission;