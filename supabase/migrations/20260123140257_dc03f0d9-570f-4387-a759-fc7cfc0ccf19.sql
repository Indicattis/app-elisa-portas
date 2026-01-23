-- Adicionar a rota principal /paineis que estava faltando
INSERT INTO public.app_routes (key, path, label, description, interface, sort_order, active)
VALUES (
  'paineis',
  '/paineis',
  'Painéis',
  'Hub principal de painéis do sistema',
  'paineis',
  0,
  true
)
ON CONFLICT (key) DO NOTHING;