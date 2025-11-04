-- Criar grupo Financeiro dentro de Administrativo
INSERT INTO app_tabs (key, label, href, icon, parent_key, sort_order, tab_group, active)
VALUES ('financeiro_group', 'Financeiro', '#', 'DollarSign', 'administrativo', 7, 'sidebar', true)
ON CONFLICT (key) DO UPDATE 
SET label = 'Financeiro', parent_key = 'administrativo', href = '#', active = true, sort_order = 7;

-- Mover Faturamento, D.R.E e Despesas para Financeiro
UPDATE app_tabs 
SET parent_key = 'financeiro_group', sort_order = 1
WHERE key = 'faturamento';

UPDATE app_tabs 
SET parent_key = 'financeiro_group', sort_order = 2
WHERE key = 'dre';

UPDATE app_tabs 
SET parent_key = 'financeiro_group', sort_order = 3
WHERE key = 'despesas';

-- Converter Compras em grupo
UPDATE app_tabs 
SET href = '#', sort_order = 8
WHERE key = 'compras';

-- Mover Estoque para dentro de Compras
UPDATE app_tabs 
SET parent_key = 'compras', sort_order = 1
WHERE key = 'estoque';