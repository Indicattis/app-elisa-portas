-- Remover permissões de acesso dos usuários
DELETE FROM user_route_access WHERE route_key = 'historico_producao';

-- Remover rota do sistema
DELETE FROM app_routes WHERE key = 'historico_producao';