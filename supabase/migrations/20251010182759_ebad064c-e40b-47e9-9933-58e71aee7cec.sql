-- Adicionar colunas para registrar alterações de categoria
ALTER TABLE public.estoque_movimentacoes 
ADD COLUMN IF NOT EXISTS categoria_anterior text,
ADD COLUMN IF NOT EXISTS categoria_nova text;

-- Atualizar check constraint para incluir 'alteracao_categoria'
ALTER TABLE public.estoque_movimentacoes 
DROP CONSTRAINT IF EXISTS estoque_movimentacoes_tipo_movimentacao_check;

ALTER TABLE public.estoque_movimentacoes 
ADD CONSTRAINT estoque_movimentacoes_tipo_movimentacao_check 
CHECK (tipo_movimentacao IN ('entrada', 'saida', 'alteracao_categoria'));

-- Comentários
COMMENT ON COLUMN public.estoque_movimentacoes.categoria_anterior IS 'Categoria anterior do produto (para tipo alteracao_categoria)';
COMMENT ON COLUMN public.estoque_movimentacoes.categoria_nova IS 'Nova categoria do produto (para tipo alteracao_categoria)';