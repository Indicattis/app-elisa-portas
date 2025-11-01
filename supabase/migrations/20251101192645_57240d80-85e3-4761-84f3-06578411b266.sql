-- Renomear "Instalações" para "Listagem de instalações" e mover para o grupo Instalações
UPDATE app_tabs 
SET label = 'Listagem de instalações', 
    parent_key = 'instalacoes_group',
    sort_order = 1,
    updated_at = now()
WHERE key = 'instalacoes';