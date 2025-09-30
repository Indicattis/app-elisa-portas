-- Ativar a aba de Instalações na sidebar
UPDATE app_tabs 
SET active = true, sort_order = 9
WHERE key = 'instalacoes';