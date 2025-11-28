-- Adicionar coluna data_nascimento na tabela admin_users
ALTER TABLE admin_users 
ADD COLUMN data_nascimento DATE;

-- Adicionar comentário na coluna
COMMENT ON COLUMN admin_users.data_nascimento IS 'Data de nascimento do usuário';