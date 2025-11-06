-- Criar enum para tipo de autorização de desconto
CREATE TYPE tipo_autorizacao_desconto AS ENUM ('responsavel_setor', 'master');

-- Adicionar coluna tipo_autorizacao na tabela vendas_autorizacoes_desconto
ALTER TABLE vendas_autorizacoes_desconto 
ADD COLUMN tipo_autorizacao tipo_autorizacao_desconto NOT NULL DEFAULT 'master';

-- Remover o default após adicionar a coluna
ALTER TABLE vendas_autorizacoes_desconto 
ALTER COLUMN tipo_autorizacao DROP DEFAULT;