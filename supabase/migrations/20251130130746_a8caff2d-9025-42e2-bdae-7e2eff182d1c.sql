-- ============================================
-- REORGANIZAÇÃO: UNIFICAR LOGÍSTICA E INSTALAÇÕES (CORRIGIDO)
-- ============================================

-- 1. Desativar rotas antigas
UPDATE app_routes SET active = false 
WHERE key IN ('instalacoes_home', 'instalacoes_listagem', 'entregas');

-- 2. Criar subitem pasta "Instalações" dentro de Logística
INSERT INTO app_routes (key, path, label, icon, parent_key, sort_order, interface, "group", description)
VALUES (
  'instalacoes_pasta',
  '#',
  'Instalações',
  'Wrench',
  'logistica_home',
  43,
  'dashboard',
  'logistica',
  'Gestão de instalações e equipes'
)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- 3. Criar nova rota para Agendamento
INSERT INTO app_routes (key, path, label, icon, parent_key, sort_order, interface, "group", description)
VALUES (
  'logistica_agendamento',
  '/dashboard/logistica/agendamento',
  'Agendamento',
  'Calendar',
  'logistica_home',
  42,
  'dashboard',
  'logistica',
  'Agendamento de carregamentos e expedição'
)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- 4. PRIMEIRO migrar as permissões de instalacoes_expedicao para logistica_agendamento
INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT user_id, 'logistica_agendamento', can_access 
FROM user_route_access 
WHERE route_key = 'instalacoes_expedicao'
ON CONFLICT (user_id, route_key) DO NOTHING;

-- 5. Depois desativar a rota antiga (não deletar para manter histórico)
UPDATE app_routes SET active = false WHERE key = 'instalacoes_expedicao';

-- 6. Mover Cronograma para dentro de Instalações
UPDATE app_routes SET 
  path = '/dashboard/logistica/instalacoes/cronograma',
  parent_key = 'instalacoes_pasta',
  sort_order = 1,
  "group" = 'logistica'
WHERE key = 'cronograma_instalacoes';

-- 7. Criar nova rota para Equipes no dashboard
INSERT INTO app_routes (key, path, label, icon, parent_key, sort_order, interface, "group", description)
VALUES (
  'instalacoes_equipes_dashboard',
  '/dashboard/logistica/instalacoes/equipes',
  'Equipes',
  'Users',
  'instalacoes_pasta',
  2,
  'dashboard',
  'logistica',
  'Gerenciar equipes de instalação'
)
ON CONFLICT (key) DO UPDATE SET
  path = EXCLUDED.path,
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  parent_key = EXCLUDED.parent_key,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- 8. Copiar permissões do cronograma para a pasta de instalações
INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT user_id, 'instalacoes_pasta', can_access 
FROM user_route_access 
WHERE route_key = 'cronograma_instalacoes'
ON CONFLICT (user_id, route_key) DO NOTHING;

-- 9. Copiar permissões do cronograma para a nova rota de equipes
INSERT INTO user_route_access (user_id, route_key, can_access)
SELECT user_id, 'instalacoes_equipes_dashboard', can_access 
FROM user_route_access 
WHERE route_key = 'cronograma_instalacoes'
ON CONFLICT (user_id, route_key) DO NOTHING;