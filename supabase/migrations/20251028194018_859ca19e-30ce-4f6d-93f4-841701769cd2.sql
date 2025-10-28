-- Move Fábrica para cima (antes de Instalações)
UPDATE app_tabs 
SET sort_order = 4
WHERE key = 'fabrica';

-- Transformar Parceiros em subitem de Vendas
UPDATE app_tabs 
SET parent_key = 'vendas_group',
    sort_order = 10
WHERE key = 'parceiros_group';