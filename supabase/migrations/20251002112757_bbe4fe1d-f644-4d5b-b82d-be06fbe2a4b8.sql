-- Adicionar coluna de telefone do cliente na tabela instalacoes_cadastradas
ALTER TABLE instalacoes_cadastradas 
ADD COLUMN telefone_cliente text;

-- Comentário descritivo
COMMENT ON COLUMN instalacoes_cadastradas.telefone_cliente IS 'Telefone de contato do cliente';