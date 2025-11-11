-- Adicionar rota de listagem de vendas
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, "group", sort_order, active) 
VALUES ('vendas_listagem', '/dashboard/vendas/listagem', 'Listagem', 'FileText', 'dashboard', 'vendas_home', 'vendas', 12, true)
ON CONFLICT (key) DO NOTHING;

-- Atualizar sort_order dos itens seguintes para abrir espaço
UPDATE app_routes SET sort_order = 13 WHERE key = 'vendas_catalogo';
UPDATE app_routes SET sort_order = 14 WHERE key = 'orcamentos';
UPDATE app_routes SET sort_order = 15 WHERE key = 'tabela_precos';
UPDATE app_routes SET sort_order = 16 WHERE key = 'parceiros_home';