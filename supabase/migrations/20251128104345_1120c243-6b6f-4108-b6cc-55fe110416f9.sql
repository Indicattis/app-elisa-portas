-- Atualizar CPFs existentes removendo formatação (apenas números)
UPDATE admin_users 
SET cpf = regexp_replace(cpf, '[^0-9]', '', 'g')
WHERE cpf IS NOT NULL AND cpf ~ '[^0-9]';