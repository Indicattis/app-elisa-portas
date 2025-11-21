-- Inserir novas rotas da interface instalações
INSERT INTO app_routes (key, path, label, description, interface, "group", sort_order, active) VALUES
('instalacoes_calendario', '/instalacoes', 'Calendário de Instalações', 'Visualizar e gerenciar instalações em calendário mensal/semanal', 'instalacoes', 'geral', 1, true),
('instalacoes_nova', '/instalacoes/nova', 'Nova Instalação', 'Cadastrar uma nova instalação', 'instalacoes', 'geral', 2, true)
ON CONFLICT (key) DO NOTHING;