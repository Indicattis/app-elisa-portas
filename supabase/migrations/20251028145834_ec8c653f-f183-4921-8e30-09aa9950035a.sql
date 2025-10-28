-- Rename existing Marketing tab to "Home"
UPDATE public.app_tabs 
SET label = 'Home'
WHERE key = 'marketing';

-- Insert new Home subitems for each main group
INSERT INTO public.app_tabs (key, label, href, parent_key, tab_group, icon, sort_order, permission, active)
VALUES
  -- Vendas Home
  ('vendas_home', 'Home', '/dashboard/vendas/home', 'vendas_group', 'sidebar', 'LayoutDashboard', 0, 'vendas', true),
  
  -- Fábrica Home
  ('fabrica_home', 'Home', '/dashboard/fabrica/home', 'fabrica', 'sidebar', 'LayoutDashboard', 0, 'producao', true),
  
  -- Instalações Home
  ('instalacoes_home', 'Home', '/dashboard/instalacoes/home', 'instalacoes_group', 'sidebar', 'LayoutDashboard', 0, 'producao', true),
  
  -- Administrativo Home
  ('administrativo_home', 'Home', '/dashboard/administrativo/home', 'administrativo', 'sidebar', 'LayoutDashboard', 0, 'configuracoes', true),
  
  -- Financeiro Home (sort_order 1 since Financeiro has its own href)
  ('financeiro_home', 'Home', '/dashboard/financeiro/home', 'financeiro', 'sidebar', 'LayoutDashboard', 1, 'faturamento', true),
  
  -- Parceiros Home
  ('parceiros_home', 'Home', '/dashboard/parceiros/home', 'parceiros_group', 'sidebar', 'LayoutDashboard', 0, 'autorizados', true),
  
  -- RH Home
  ('rh_home', 'Home', '/dashboard/rh/home', 'rh_group', 'sidebar', 'LayoutDashboard', 0, 'organograma', true);

-- Update sort_order for existing items to come after Home
UPDATE public.app_tabs 
SET sort_order = sort_order + 1
WHERE parent_key IN ('vendas_group', 'fabrica', 'instalacoes_group', 'administrativo', 'parceiros_group', 'rh_group')
AND key NOT IN ('vendas_home', 'fabrica_home', 'instalacoes_home', 'administrativo_home', 'parceiros_home', 'rh_home');