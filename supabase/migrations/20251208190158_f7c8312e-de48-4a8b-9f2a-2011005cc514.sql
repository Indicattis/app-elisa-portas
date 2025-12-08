-- Add /instalacoes/controle route to app_routes for permissions management
INSERT INTO public.app_routes (key, path, label, interface, icon, active, sort_order)
VALUES (
  'instalacoes_controle',
  '/instalacoes/controle',
  'Controle de Instalações',
  'instalacoes',
  'ClipboardList',
  true,
  2
)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  interface = EXCLUDED.interface;