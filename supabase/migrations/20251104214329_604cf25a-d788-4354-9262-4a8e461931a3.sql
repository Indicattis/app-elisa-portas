-- Atualizar label, href e key do menu de Licenciados para Franqueados
UPDATE app_tabs 
SET 
  label = 'Franqueados',
  href = '/dashboard/parceiros/franqueados',
  key = 'franqueados'
WHERE key = 'licenciados';

-- Atualizar permissão de licenciados para franqueados
ALTER TYPE app_permission RENAME VALUE 'licenciados' TO 'franqueados';