-- Adicionar rota do hub Marketing
INSERT INTO public.app_routes (key, path, label, description, interface, sort_order, active)
VALUES (
  'marketing_hub',
  '/marketing',
  'Marketing',
  'Hub principal de marketing',
  'marketing',
  5,
  true
)
ON CONFLICT (key) DO NOTHING;