-- Atualizar páginas sem permissão na tabela app_tabs

-- Páginas com permissões específicas novas
UPDATE app_tabs SET permission = 'aparencia' WHERE key = 'config_aparencia';
UPDATE app_tabs SET permission = 'direcao' WHERE key = 'direcao';
UPDATE app_tabs SET permission = 'logistica' WHERE key = 'logistica_home';
UPDATE app_tabs SET permission = 'fornecedores' WHERE key = 'fornecedores';
UPDATE app_tabs SET permission = 'vagas' WHERE key = 'vagas';
UPDATE app_tabs SET permission = 'dre' WHERE key = 'dre';
UPDATE app_tabs SET permission = 'despesas' WHERE key = 'despesas';
UPDATE app_tabs SET permission = 'dp_rh' WHERE key = 'dp-rh';

-- Reutilizar permissões existentes
UPDATE app_tabs SET permission = 'compras' WHERE key = 'requisicoes_compra';
UPDATE app_tabs SET permission = 'logistica' WHERE key = 'logistica_entregas';
UPDATE app_tabs SET permission = 'producao' WHERE key = 'producao_pintura';