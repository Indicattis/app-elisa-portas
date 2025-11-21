-- Adicionar rota de suporte na tabela app_routes
INSERT INTO app_routes (
  key, 
  path, 
  label, 
  icon, 
  parent_key, 
  interface, 
  description, 
  sort_order, 
  active
) VALUES (
  'vendas_suporte',
  '/dashboard/vendas/suporte',
  'Suporte',
  'FileText',
  'vendas_home',
  'dashboard',
  'Gerenciar chamados de suporte',
  40,
  true
)
ON CONFLICT (key) DO NOTHING;