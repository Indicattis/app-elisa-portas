-- Mover Catálogo de Vendas para dentro do grupo Vendas
UPDATE app_tabs 
SET parent_key = 'vendas_group', 
    sort_order = 4
WHERE key = 'vendas_catalogo';