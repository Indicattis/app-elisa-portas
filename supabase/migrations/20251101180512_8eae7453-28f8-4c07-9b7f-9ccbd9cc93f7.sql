-- Criar tabela entregas
CREATE TABLE IF NOT EXISTS public.entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid REFERENCES public.vendas(id) ON DELETE CASCADE,
  pedido_id uuid REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  nome_cliente text NOT NULL,
  telefone_cliente text,
  cidade text NOT NULL,
  estado text NOT NULL,
  latitude double precision,
  longitude double precision,
  geocode_precision text,
  last_geocoded_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_producao', 'em_rota', 'concluida', 'cancelada')),
  data_entrega date,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view entregas"
ON public.entregas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert entregas"
ON public.entregas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true
  )
);

CREATE POLICY "Authenticated users can update entregas"
ON public.entregas FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete entregas"
ON public.entregas FOR DELETE
TO authenticated
USING (is_admin());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_entregas_venda_id ON public.entregas(venda_id);
CREATE INDEX IF NOT EXISTS idx_entregas_pedido_id ON public.entregas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON public.entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_data_entrega ON public.entregas(data_entrega);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_entregas_updated_at
BEFORE UPDATE ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();