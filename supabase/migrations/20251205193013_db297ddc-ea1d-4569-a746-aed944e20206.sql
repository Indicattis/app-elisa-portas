-- Desativar a rota vendas_listagem
UPDATE app_routes SET active = false WHERE key = 'vendas_listagem';

-- Remover permissões de acesso à rota vendas_listagem
DELETE FROM user_route_access WHERE route_key = 'vendas_listagem';