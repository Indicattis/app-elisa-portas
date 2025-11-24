-- Adicionar novas rotas para gerenciamento de estoque

-- Rota de gerenciamento de estoque (categorias, subcategorias, movimentações)
INSERT INTO app_routes (key, path, label, description, "group", interface, parent_key, sort_order, active)
VALUES (
  'estoque_gerenciamento',
  '/dashboard/administrativo/compras/estoque/gerenciamento',
  'Gerenciamento de Estoque',
  'Gerenciar categorias, subcategorias e visualizar movimentações',
  'Compras',
  'dashboard',
  'estoque',
  104,
  true
)
ON CONFLICT (key) DO NOTHING;

-- Rota de visualização/edição de produto
INSERT INTO app_routes (key, path, label, description, "group", interface, parent_key, sort_order, active)
VALUES (
  'estoque_editar',
  '/dashboard/administrativo/compras/estoque/editar/:id',
  'Editar Produto de Estoque',
  'Visualizar e editar detalhes de produtos do estoque',
  'Compras',
  'dashboard',
  'estoque',
  105,
  true
)
ON CONFLICT (key) DO NOTHING;