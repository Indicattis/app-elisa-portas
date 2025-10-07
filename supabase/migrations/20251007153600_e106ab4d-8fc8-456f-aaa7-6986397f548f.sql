-- Change label from "Parceiros" to "Autorizados" for the submenu item
UPDATE app_tabs 
SET label = 'Autorizados'
WHERE key = 'parceiros' AND parent_key = 'parceiros_group';