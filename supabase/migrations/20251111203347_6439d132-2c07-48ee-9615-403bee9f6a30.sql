-- Inserir rotas de Direção no menu principal
INSERT INTO app_routes (key, path, label, icon, interface, parent_key, sort_order, active, description) VALUES 
('direcao', '/dashboard/direcao', 'Direção', 'Shield', 'dashboard', NULL, 1, true, 'Gestão e acompanhamento de tarefas da direção'),
('direcao_checklist', '/dashboard/direcao/checklist', 'Checklist', 'ClipboardCheck', 'dashboard', 'direcao', 2, true, 'Gerenciar tarefas por usuário');