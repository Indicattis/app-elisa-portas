-- Desativar a rota tabela_precos da sidebar
UPDATE app_routes SET active = false WHERE key = 'tabela_precos';

-- Remover permissões individuais da tabela_precos
DELETE FROM user_route_access WHERE route_key = 'tabela_precos';