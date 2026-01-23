-- Atualizar interface das rotas de Marketing para 'minimalista'
UPDATE public.app_routes 
SET interface = 'minimalista'
WHERE key IN (
  'marketing_hub',
  'marketing_performance',
  'marketing_canais_aquisicao',
  'marketing_investimentos'
);