-- Drop the existing view first
DROP VIEW IF EXISTS public.user_tab_access;

-- Add parent_key column to app_tabs
ALTER TABLE public.app_tabs ADD COLUMN IF NOT EXISTS parent_key text;

-- Create index for parent_key
CREATE INDEX IF NOT EXISTS idx_app_tabs_parent_key ON public.app_tabs(parent_key);

-- Recreate user_tab_access view with correct structure
CREATE OR REPLACE VIEW public.user_tab_access AS
SELECT 
  t.id,
  t.key,
  t.label,
  t.href,
  t.icon,
  t.permission,
  t.tab_group,
  t.sort_order,
  t.parent_key,
  CASE 
    WHEN t.permission IS NULL THEN true
    ELSE EXISTS (
      SELECT 1 
      FROM public.admin_users au
      JOIN public.role_permissions rp ON au.role = rp.role
      WHERE au.user_id = auth.uid() 
        AND au.ativo = true
        AND rp.permission = t.permission
    )
  END as can_access
FROM public.app_tabs t
WHERE t.active = true
ORDER BY t.sort_order;

-- Insert main groups (parent items)
INSERT INTO public.app_tabs (key, label, href, icon, permission, tab_group, sort_order, parent_key, active)
VALUES 
  ('administrativo', 'Administrativo', '#', 'Settings', NULL, 'sidebar', 1, NULL, true),
  ('vendas_group', 'Vendas', '#', 'ShoppingCart', NULL, 'sidebar', 2, NULL, true),
  ('marketing_group', 'Marketing', '#', 'TrendingUp', NULL, 'sidebar', 3, NULL, true),
  ('fabrica', 'Fábrica', '#', 'Factory', NULL, 'sidebar', 4, NULL, true),
  ('instalacoes_group', 'Instalações', '#', 'Wrench', NULL, 'sidebar', 5, NULL, true),
  ('rh_group', 'RH', '#', 'Users', NULL, 'sidebar', 6, NULL, true),
  ('parceiros_group', 'Parceiros', '#', 'Handshake', NULL, 'sidebar', 7, NULL, true)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Update existing tabs to set their parent_key and adjust labels
UPDATE public.app_tabs SET parent_key = 'administrativo', sort_order = 1, label = 'Faturamento' WHERE key = 'faturamento';
UPDATE public.app_tabs SET parent_key = 'administrativo', sort_order = 2, label = 'Contas a Receber' WHERE key = 'contas_receber';
UPDATE public.app_tabs SET parent_key = 'administrativo', sort_order = 5, label = 'Documentos' WHERE key = 'documentos';

UPDATE public.app_tabs SET parent_key = 'vendas_group', sort_order = 1, label = 'Orçamentos' WHERE key = 'orcamentos';
UPDATE public.app_tabs SET parent_key = 'vendas_group', sort_order = 2, label = 'Vendas' WHERE key = 'vendas';
UPDATE public.app_tabs SET parent_key = 'vendas_group', sort_order = 3, label = 'Visitas' WHERE key = 'visitas';

UPDATE public.app_tabs SET parent_key = 'marketing_group', sort_order = 1, label = 'Marketing' WHERE key = 'marketing';
UPDATE public.app_tabs SET parent_key = 'marketing_group', sort_order = 2, label = 'Performance' WHERE key = 'performance';

UPDATE public.app_tabs SET parent_key = 'fabrica', sort_order = 1, label = 'Pedidos' WHERE key = 'pedidos';
UPDATE public.app_tabs SET parent_key = 'fabrica', sort_order = 2, label = 'Produção' WHERE key = 'producao';
UPDATE public.app_tabs SET parent_key = 'fabrica', sort_order = 4, label = 'Calendário' WHERE key = 'calendario';

UPDATE public.app_tabs SET parent_key = 'instalacoes_group', sort_order = 1, label = 'Instalações' WHERE key = 'instalacoes';

UPDATE public.app_tabs SET parent_key = 'rh_group', sort_order = 1, label = 'Organograma' WHERE key = 'organograma';

UPDATE public.app_tabs SET parent_key = 'parceiros_group', sort_order = 1, label = 'Parceiros' WHERE key = 'parceiros';
UPDATE public.app_tabs SET parent_key = 'parceiros_group', sort_order = 2, label = 'Mapa' WHERE key = 'mapa';
UPDATE public.app_tabs SET parent_key = 'parceiros_group', sort_order = 3, label = 'Histórico' WHERE key = 'historico';

-- Insert new tabs under groups
INSERT INTO public.app_tabs (key, label, href, icon, permission, tab_group, sort_order, parent_key, active)
VALUES 
  ('compras', 'Compras', '/dashboard/compras', 'ShoppingCart', NULL, 'sidebar', 3, 'administrativo', true),
  ('estoque', 'Estoque', '/dashboard/estoque', 'Package', NULL, 'sidebar', 4, 'administrativo', true),
  ('cronograma', 'Cronograma', '/dashboard/instalacoes/cronograma', 'Calendar', NULL, 'sidebar', 2, 'instalacoes_group', true),
  ('rh_admin', 'Administração', '/dashboard/rh-admin', 'UserCog', NULL, 'sidebar', 2, 'rh_group', true),
  ('rh_documentos', 'Documentos RH', '/dashboard/rh-documentos', 'FileText', NULL, 'sidebar', 3, 'rh_group', true),
  ('representantes', 'Representantes', '/dashboard/parceiros/representantes', 'Briefcase', NULL, 'sidebar', 4, 'parceiros_group', true),
  ('licenciados', 'Licenciados', '/dashboard/parceiros/licenciados', 'Award', NULL, 'sidebar', 5, 'parceiros_group', true)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  href = EXCLUDED.href,
  icon = EXCLUDED.icon,
  permission = EXCLUDED.permission,
  sort_order = EXCLUDED.sort_order,
  parent_key = EXCLUDED.parent_key,
  active = EXCLUDED.active;

-- Deactivate old tabs that are no longer needed
UPDATE public.app_tabs SET active = false WHERE key IN ('dashboard', 'users');