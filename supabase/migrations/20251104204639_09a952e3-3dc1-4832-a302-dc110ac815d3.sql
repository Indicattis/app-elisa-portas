-- Desativar Organograma da sidebar
UPDATE app_tabs 
SET active = false
WHERE key = 'organograma';