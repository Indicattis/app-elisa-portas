-- Adicionar sub-rotas do hub Marketing
INSERT INTO public.app_routes (key, path, label, description, interface, parent_key, sort_order, active)
VALUES 
  (
    'marketing_performance',
    '/marketing/performance',
    'Performance',
    'Análise de performance de marketing',
    'marketing',
    'marketing_hub',
    10,
    true
  ),
  (
    'marketing_canais_aquisicao',
    '/marketing/canais-aquisicao',
    'Canais de Aquisição',
    'Gerenciamento de canais de aquisição',
    'marketing',
    'marketing_hub',
    20,
    true
  ),
  (
    'marketing_investimentos',
    '/marketing/investimentos',
    'Investimentos',
    'Gestão de investimentos em marketing',
    'marketing',
    'marketing_hub',
    30,
    true
  )
ON CONFLICT (key) DO NOTHING;