-- Atualizar rotas de financeiro para serem sub-itens do financeiro_home

-- Primeiro, garantir que temos a rota pai
INSERT INTO app_routes (key, path, label, description, icon, interface, sort_order, active)
VALUES (
  'financeiro_home',
  '/dashboard/administrativo/financeiro',
  'Financeiro',
  'Gestão financeira e contábil da empresa',
  'DollarSign',
  'admin',
  30,
  true
)
ON CONFLICT (key) DO UPDATE SET
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Atualizar as rotas filhas para terem o parent_key correto
UPDATE app_routes 
SET parent_key = 'financeiro_home'
WHERE key IN ('financeiro_faturamento', 'financeiro_dre', 'financeiro_despesas', 'financeiro_caixa')
  AND (parent_key IS NULL OR parent_key != 'financeiro_home');

-- Se as rotas filhas não existirem, vamos criá-las
INSERT INTO app_routes (key, path, label, description, icon, interface, parent_key, sort_order, active)
VALUES 
  (
    'financeiro_faturamento',
    '/dashboard/administrativo/financeiro/faturamento',
    'Faturamento',
    'Controle de notas fiscais e faturamento',
    'Receipt',
    'admin',
    'financeiro_home',
    31,
    true
  ),
  (
    'financeiro_dre',
    '/dashboard/administrativo/financeiro/dre',
    'DRE',
    'Demonstrativo de Resultados do Exercício',
    'TrendingUp',
    'admin',
    'financeiro_home',
    32,
    true
  ),
  (
    'financeiro_despesas',
    '/dashboard/administrativo/financeiro/despesas',
    'Despesas',
    'Controle de despesas operacionais',
    'CreditCard',
    'admin',
    'financeiro_home',
    33,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order;