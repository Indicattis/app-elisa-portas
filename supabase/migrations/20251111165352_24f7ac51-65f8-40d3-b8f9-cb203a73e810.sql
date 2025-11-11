-- Adicionar rota de listagem de instalações
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, "group", sort_order, active) 
VALUES ('instalacoes_listagem', '/dashboard/instalacoes/listagem', 'Listagem', 'FileText', 'dashboard', 'instalacoes_home', 'instalacoes', 38, true)
ON CONFLICT (key) DO NOTHING;

-- Atualizar sort_order dos itens seguintes para abrir espaço
UPDATE app_routes SET sort_order = 39 WHERE key = 'cronograma_instalacoes';