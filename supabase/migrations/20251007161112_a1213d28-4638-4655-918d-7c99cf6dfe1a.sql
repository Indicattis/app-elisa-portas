-- Criar grupo Financeiro
INSERT INTO app_tabs (key, label, href, tab_group, parent_key, sort_order, active, icon, permission)
VALUES ('financeiro', 'Financeiro', '/dashboard/financeiro', 'sidebar', NULL, 2, true, 'DollarSign', NULL);

-- Mover Faturamento para Financeiro
UPDATE app_tabs 
SET parent_key = 'financeiro', sort_order = 1
WHERE key = 'faturamento';

-- Ativar e mover Contas a Receber para Financeiro
UPDATE app_tabs 
SET parent_key = 'financeiro', sort_order = 2, active = true
WHERE key = 'contas_receber';

-- Ajustar sort_order dos outros grupos principais
UPDATE app_tabs SET sort_order = 3 WHERE key = 'vendas_group' AND parent_key IS NULL;
UPDATE app_tabs SET sort_order = 4 WHERE key = 'fabrica' AND parent_key IS NULL;
UPDATE app_tabs SET sort_order = 5 WHERE key = 'parceiros_group' AND parent_key IS NULL;
UPDATE app_tabs SET sort_order = 6 WHERE key = 'instalacoes' AND parent_key IS NULL;