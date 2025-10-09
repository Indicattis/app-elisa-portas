-- Adicionar campo para aprovação de frete na tabela vendas
ALTER TABLE vendas 
ADD COLUMN frete_aprovado BOOLEAN NOT NULL DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN vendas.frete_aprovado IS 'Indica se o valor do frete foi revisado e aprovado para faturamento';