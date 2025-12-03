-- Adicionar rota no menu com parent_key correto
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, sort_order, active)
VALUES (
  'vendas_clientes',
  '/dashboard/vendas/clientes',
  'Clientes',
  'Users',
  'dashboard',
  'vendas_home',
  45,
  true
);