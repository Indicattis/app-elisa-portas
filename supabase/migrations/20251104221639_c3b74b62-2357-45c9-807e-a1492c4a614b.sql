-- Inserir fornecedores na sidebar como filho de compras
INSERT INTO app_tabs (key, label, href, parent_key, icon, tab_group, sort_order, permission, active)
VALUES ('fornecedores', 'Fornecedores', '/dashboard/compras/fornecedores', 'compras', 'Package', 'sidebar', 1, NULL, true)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  parent_key = EXCLUDED.parent_key,
  icon = EXCLUDED.icon,
  active = EXCLUDED.active,
  updated_at = now();