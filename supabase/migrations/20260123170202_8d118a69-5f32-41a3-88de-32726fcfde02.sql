-- 1. Excluir permissões de acesso das rotas dashboard
DELETE FROM user_route_access 
WHERE route_key IN (
  SELECT key FROM app_routes WHERE interface = 'dashboard'
);

-- 2. Remover referências parent_key de rotas de OUTRAS interfaces que apontam para rotas dashboard
UPDATE app_routes SET parent_key = NULL 
WHERE parent_key IN (SELECT key FROM app_routes WHERE interface = 'dashboard');

-- 3. Remover referências parent_key dentro das próprias rotas dashboard
UPDATE app_routes SET parent_key = NULL WHERE interface = 'dashboard';

-- 4. Excluir as rotas da interface dashboard (agora sem dependências)
DELETE FROM app_routes WHERE interface = 'dashboard';

-- 5. Renomear interface 'minimalista' para 'padrao'
UPDATE app_routes SET interface = 'padrao' WHERE interface = 'minimalista';