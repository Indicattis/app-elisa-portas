-- Atualizar rotas para a interface paineis
UPDATE app_routes 
SET 
  interface = 'paineis',
  path = '/paineis/tv-dashboard',
  "group" = 'paineis'
WHERE key = 'tv_dashboard';

UPDATE app_routes 
SET 
  interface = 'paineis',
  path = '/paineis/calendario',
  "group" = 'paineis'
WHERE key = 'calendario';

UPDATE app_routes 
SET 
  interface = 'paineis',
  path = '/paineis/diario-bordo',
  "group" = 'paineis'
WHERE key = 'diario_bordo';

UPDATE app_routes 
SET 
  interface = 'paineis',
  path = '/paineis/mapa',
  "group" = 'paineis'
WHERE key = 'mapa_autorizados';

UPDATE app_routes 
SET 
  interface = 'dashboard',
  path = '/dashboard/marketing/performance',
  "group" = 'Marketing',
  parent_key = 'marketing'
WHERE key = 'performance';

-- Remover contador_vendas do grupo Painéis (mover para dashboard ou manter)
UPDATE app_routes 
SET 
  interface = 'paineis',
  "group" = 'paineis'
WHERE key = 'contador_vendas';