-- Remover constraint antigo de tipo
ALTER TABLE notas_fiscais DROP CONSTRAINT IF EXISTS notas_fiscais_tipo_check;

-- Adicionar constraint expandido com todos os tipos possíveis
ALTER TABLE notas_fiscais ADD CONSTRAINT notas_fiscais_tipo_check 
CHECK (tipo IN ('entrada', 'saida', 'nfe', 'nfse'));