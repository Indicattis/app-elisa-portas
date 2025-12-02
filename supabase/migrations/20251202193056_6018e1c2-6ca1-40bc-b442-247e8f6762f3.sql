-- Remover permissões de acesso da rota de etiquetas
DELETE FROM user_route_access WHERE route_key = 'etiquetas';

-- Remover a rota da tabela app_routes
DELETE FROM app_routes WHERE key = 'etiquetas';