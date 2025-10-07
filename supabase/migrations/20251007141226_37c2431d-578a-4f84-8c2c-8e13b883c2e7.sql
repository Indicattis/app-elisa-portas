-- Update contador_vendas to be a child of vendas_group
UPDATE public.app_tabs 
SET 
  parent_key = 'vendas_group',
  sort_order = 4,
  label = 'Contador de Vendas'
WHERE key = 'contador_vendas';

-- If the tab doesn't exist, insert it
INSERT INTO public.app_tabs (key, label, href, icon, permission, tab_group, sort_order, parent_key, active)
VALUES ('contador_vendas', 'Contador de Vendas', '/dashboard/contador-vendas', 'Calculator', NULL, 'sidebar', 4, 'vendas_group', true)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;