-- Adicionar requisições de compra na sidebar
INSERT INTO app_tabs (key, label, href, parent_key, icon, tab_group, sort_order, permission, active)
VALUES ('requisicoes_compra', 'Requisições de Compra', '/dashboard/compras/requisicoes', 'compras', 'ShoppingCart', 'sidebar', 2, NULL, true)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  parent_key = EXCLUDED.parent_key,
  icon = EXCLUDED.icon,
  active = EXCLUDED.active,
  updated_at = now();