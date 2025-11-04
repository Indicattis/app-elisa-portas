-- Desativar a página Home de Parceiros
UPDATE app_tabs 
SET active = false 
WHERE href = '/dashboard/parceiros/home';