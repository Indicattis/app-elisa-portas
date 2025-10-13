-- Remover a coluna custo_total gerada existente
ALTER TABLE vendas DROP COLUMN IF EXISTS custo_total;

-- Recriar como coluna normal (não gerada)
ALTER TABLE vendas 
ADD COLUMN custo_total NUMERIC DEFAULT 0;

-- Comentário: A coluna custo_total agora é uma coluna normal que será calculada 
-- e salva apenas quando o usuário clicar em "Salvar Tudo" no faturamento