-- Inserir nova rota custos
INSERT INTO public.app_routes (key, path, label, parent_key, icon, sort_order, interface, "group", active)
VALUES (
  'financeiro_custos',
  '/dashboard/administrativo/financeiro/custos',
  'Custos',
  'financeiro_home',
  'Coins',
  3,
  'dashboard',
  'administrativo',
  true
);

-- Desativar rota antiga de despesas
UPDATE public.app_routes 
SET active = false
WHERE key = 'financeiro_despesas';