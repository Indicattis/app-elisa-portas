-- Adicionar coluna de categoria à tabela estoque
ALTER TABLE public.estoque 
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'geral';

-- Criar índice para melhor performance nas buscas por categoria
CREATE INDEX IF NOT EXISTS idx_estoque_categoria ON public.estoque(categoria);

-- Comentário explicativo
COMMENT ON COLUMN public.estoque.categoria IS 'Categoria do produto: geral, ferragem, acessorio, perfil, componente, consumivel';