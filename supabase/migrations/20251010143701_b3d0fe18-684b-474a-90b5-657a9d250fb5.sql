-- Criar tabela de estoque para produtos
CREATE TABLE IF NOT EXISTS public.estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_produto text NOT NULL,
  descricao_produto text,
  quantidade integer NOT NULL DEFAULT 0,
  unidade text DEFAULT 'UN',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS na tabela estoque
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para estoque
CREATE POLICY "Authenticated users can view estoque"
ON public.estoque FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage estoque"
ON public.estoque FOR ALL
USING (auth.uid() IS NOT NULL);

-- Criar tabela de linhas do pedido principal
CREATE TABLE IF NOT EXISTS public.pedido_linhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  estoque_id uuid REFERENCES public.estoque(id) ON DELETE SET NULL,
  nome_produto text NOT NULL,
  descricao_produto text,
  quantidade integer NOT NULL DEFAULT 1,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela pedido_linhas
ALTER TABLE public.pedido_linhas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pedido_linhas
CREATE POLICY "Authenticated users can view pedido_linhas"
ON public.pedido_linhas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage pedido_linhas"
ON public.pedido_linhas FOR ALL
USING (auth.uid() IS NOT NULL);

-- Adicionar campo status_preenchimento na tabela pedidos_producao
ALTER TABLE public.pedidos_producao 
ADD COLUMN IF NOT EXISTS status_preenchimento text DEFAULT 'pendente' CHECK (status_preenchimento IN ('pendente', 'preenchido'));

-- Garantir CASCADE DELETE na relação venda_id (se já não existir)
-- Primeiro verificar se a constraint existe e removê-la se necessário
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pedidos_producao_venda_id_fkey' 
    AND table_name = 'pedidos_producao'
  ) THEN
    ALTER TABLE public.pedidos_producao 
    DROP CONSTRAINT pedidos_producao_venda_id_fkey;
  END IF;
END $$;

-- Adicionar a constraint com CASCADE DELETE
ALTER TABLE public.pedidos_producao
ADD CONSTRAINT pedidos_producao_venda_id_fkey 
FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedido_linhas_pedido_id ON public.pedido_linhas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_linhas_estoque_id ON public.pedido_linhas(estoque_id);
CREATE INDEX IF NOT EXISTS idx_estoque_ativo ON public.estoque(ativo) WHERE ativo = true;

-- Trigger para atualizar updated_at em estoque
CREATE OR REPLACE FUNCTION update_estoque_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_estoque_updated_at
BEFORE UPDATE ON public.estoque
FOR EACH ROW
EXECUTE FUNCTION update_estoque_updated_at();

-- Trigger para atualizar updated_at em pedido_linhas
CREATE OR REPLACE FUNCTION update_pedido_linhas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pedido_linhas_updated_at
BEFORE UPDATE ON public.pedido_linhas
FOR EACH ROW
EXECUTE FUNCTION update_pedido_linhas_updated_at();