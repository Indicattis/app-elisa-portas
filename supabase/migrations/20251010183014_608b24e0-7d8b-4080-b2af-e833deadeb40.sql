-- Criar tabela de categorias de estoque
CREATE TABLE IF NOT EXISTS public.estoque_categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  cor text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.estoque_categorias ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view categorias" 
ON public.estoque_categorias 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage categorias" 
ON public.estoque_categorias 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Inserir categorias padrão
INSERT INTO public.estoque_categorias (nome, cor, ordem) VALUES
  ('Geral', 'gray', 1),
  ('Ferragem', 'blue', 2),
  ('Acessório', 'purple', 3),
  ('Perfil', 'green', 4),
  ('Componente', 'orange', 5),
  ('Consumível', 'red', 6)
ON CONFLICT (nome) DO NOTHING;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_estoque_categorias_ativo ON public.estoque_categorias(ativo);
CREATE INDEX IF NOT EXISTS idx_estoque_categorias_ordem ON public.estoque_categorias(ordem);

COMMENT ON TABLE public.estoque_categorias IS 'Categorias personalizáveis para produtos do estoque';