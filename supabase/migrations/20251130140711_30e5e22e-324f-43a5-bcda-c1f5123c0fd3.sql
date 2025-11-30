-- Remover coluna redundante responsavel_tipo da tabela ordens_carregamento
-- A coluna tipo_carregamento (ENUM) já armazena esta informação

ALTER TABLE ordens_carregamento 
DROP COLUMN IF EXISTS responsavel_tipo;