-- Adicionar coluna lado_motor na tabela pedido_porta_observacoes
ALTER TABLE public.pedido_porta_observacoes 
ADD COLUMN IF NOT EXISTS lado_motor TEXT DEFAULT 'esquerdo';

-- Comentário explicativo
COMMENT ON COLUMN public.pedido_porta_observacoes.lado_motor IS 'Lado do motor: esquerdo ou direito';