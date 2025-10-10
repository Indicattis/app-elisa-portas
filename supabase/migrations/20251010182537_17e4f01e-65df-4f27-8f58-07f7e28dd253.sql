-- Criar tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  tipo_movimentacao text NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida')),
  quantidade integer NOT NULL CHECK (quantidade > 0),
  quantidade_anterior integer NOT NULL,
  quantidade_nova integer NOT NULL,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Policies para estoque_movimentacoes
CREATE POLICY "Authenticated users can view movimentacoes" 
ON public.estoque_movimentacoes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create movimentacoes" 
ON public.estoque_movimentacoes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_produto_id ON public.estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_movimentacoes_created_at ON public.estoque_movimentacoes(created_at DESC);

-- Comentários explicativos
COMMENT ON TABLE public.estoque_movimentacoes IS 'Registra todas as movimentações de entrada e saída de estoque';
COMMENT ON COLUMN public.estoque_movimentacoes.tipo_movimentacao IS 'Tipo da movimentação: entrada ou saida';