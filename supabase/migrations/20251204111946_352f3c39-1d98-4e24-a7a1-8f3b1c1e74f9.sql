-- Adicionar rota contas_receber ao sistema de permissões
INSERT INTO public.app_routes (key, label, path, icon, "group", interface, parent_key, sort_order, active, description)
VALUES (
  'contas_receber',
  'Contas a Receber',
  '/dashboard/administrativo/financeiro/contas-a-receber',
  'HandCoins',
  'administrativo',
  'dashboard',
  'financeiro_home',
  34,
  true,
  'Gestão de parcelas e recebimentos das vendas'
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;