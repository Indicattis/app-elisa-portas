-- Primeiro, inserir a nova rota
INSERT INTO app_routes (key, label, path, parent_key, interface, description, icon, sort_order, active)
VALUES ('logistica_suporte', 'Suporte', '/dashboard/logistica/suporte', 'logistica_home', 'dashboard', 'Gerenciar chamados de suporte', 'FileText', 50, true);

-- Atualizar permissões para usar a nova key
UPDATE user_route_access 
SET route_key = 'logistica_suporte'
WHERE route_key = 'vendas_suporte';

-- Desativar a rota antiga
UPDATE app_routes SET active = false WHERE key = 'vendas_suporte';