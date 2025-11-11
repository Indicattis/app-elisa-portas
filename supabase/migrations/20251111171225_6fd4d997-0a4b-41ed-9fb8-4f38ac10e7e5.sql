-- Atualizar rotas admin para ter interface = 'admin' e sort_order correto
UPDATE app_routes 
SET interface = 'admin', sort_order = 1, icon = 'LayoutDashboard'
WHERE key = 'admin';

UPDATE app_routes 
SET interface = 'admin', sort_order = 2
WHERE key = 'admin_permissions';

UPDATE app_routes 
SET interface = 'admin', sort_order = 3, parent_key = 'admin', icon = 'Users'
WHERE key = 'users';
