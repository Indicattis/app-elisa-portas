-- Adicionar item "Vendas" na sidebar
INSERT INTO public.app_tabs (
  key,
  label,
  href,
  permission,
  tab_group,
  sort_order,
  active,
  icon
) VALUES (
  'vendas',
  'Vendas',
  '/dashboard/vendas',
  'vendas',
  'sidebar',
  13,
  true,
  'ShoppingCart'
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  permission = EXCLUDED.permission,
  active = EXCLUDED.active;