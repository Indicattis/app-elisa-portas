-- Adicionar rota de empresas emissoras na sidebar do admin
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, sort_order, active)
VALUES ('admin_companies', '/admin/companies', 'Empresas Emissoras', 'Building2', 'admin', 'admin', 5, true)
ON CONFLICT (key) DO NOTHING;