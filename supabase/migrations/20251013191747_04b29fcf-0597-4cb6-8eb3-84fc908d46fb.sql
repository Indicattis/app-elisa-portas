-- Adicionar campo faturamento na tabela produtos_vendas
ALTER TABLE produtos_vendas 
ADD COLUMN faturamento boolean DEFAULT false;

-- Atualizar produtos existentes que já têm lucro definido
UPDATE produtos_vendas 
SET faturamento = true 
WHERE lucro_item IS NOT NULL;