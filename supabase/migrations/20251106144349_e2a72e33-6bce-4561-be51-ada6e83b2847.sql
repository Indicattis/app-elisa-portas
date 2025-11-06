-- Adicionar aba "Catálogo de Vendas" no sidebar
INSERT INTO app_tabs (
  label, 
  href, 
  icon, 
  key, 
  tab_group, 
  sort_order, 
  active, 
  permission,
  parent_key
) VALUES (
  'Catálogo de Vendas', 
  '/dashboard/vendas-catalogo', 
  'ShoppingCart',
  'vendas_catalogo',
  'sidebar',
  2,
  true,
  'estoque',
  'compras'
)
ON CONFLICT (key) DO NOTHING;