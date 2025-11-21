-- Adicionar novas rotas ao sistema de gerenciamento de permissões

-- Rota: Gestão de Caixa (já deve existir, mas vamos garantir com ON CONFLICT)
INSERT INTO app_routes (key, path, label, description, icon, interface, parent_key, sort_order, active)
VALUES (
  'financeiro_caixa',
  '/dashboard/administrativo/financeiro/caixa',
  'Gestão de Caixa',
  'Controle de depósitos e movimentações financeiras',
  'Wallet',
  'admin',
  'financeiro_home',
  40,
  true
)
ON CONFLICT (key) DO NOTHING;

-- Rota: Suporte ao Cliente
INSERT INTO app_routes (key, path, label, description, icon, interface, parent_key, sort_order, active)
VALUES (
  'vendas_suporte',
  '/dashboard/vendas/suporte',
  'Suporte ao Cliente',
  'Gerenciamento de chamados e solicitações de suporte',
  'HeadphonesIcon',
  'admin',
  NULL,
  90,
  true
)
ON CONFLICT (key) DO NOTHING;

-- Rota: Contratos de Vendas
INSERT INTO app_routes (key, path, label, description, icon, interface, parent_key, sort_order, active)
VALUES (
  'vendas_contratos',
  '/dashboard/vendas/contratos',
  'Contratos',
  'Gerenciamento de contratos e templates',
  'FileText',
  'admin',
  NULL,
  95,
  true
)
ON CONFLICT (key) DO NOTHING;