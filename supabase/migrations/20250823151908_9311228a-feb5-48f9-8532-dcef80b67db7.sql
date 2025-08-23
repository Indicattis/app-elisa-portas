-- Remove campos de produto único e manter apenas o campo produtos para múltiplos produtos
ALTER TABLE public.pedidos_producao 
DROP COLUMN IF EXISTS produto_tipo,
DROP COLUMN IF EXISTS produto_cor, 
DROP COLUMN IF EXISTS produto_altura,
DROP COLUMN IF EXISTS produto_largura;

-- Garantir que a coluna produtos tenha uma estrutura padrão
ALTER TABLE public.pedidos_producao 
ALTER COLUMN produtos SET DEFAULT '[]'::jsonb;