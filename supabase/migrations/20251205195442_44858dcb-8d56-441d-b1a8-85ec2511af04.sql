-- Desativar a rota contratos_vendas da sidebar
UPDATE app_routes SET active = false WHERE key = 'contratos_vendas';

-- Remover permissões individuais de contratos_vendas
DELETE FROM user_route_access WHERE route_key = 'contratos_vendas';