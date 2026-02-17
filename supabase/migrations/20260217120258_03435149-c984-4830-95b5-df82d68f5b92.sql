
-- Create correcoes table (similar to instalacoes, for correction orders from finalized pedidos)
CREATE TABLE public.correcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES public.pedidos_producao(id),
  venda_id UUID REFERENCES public.vendas(id),
  nome_cliente TEXT NOT NULL,
  data_correcao DATE,
  hora TEXT DEFAULT '08:00',
  responsavel_correcao_id UUID,
  responsavel_correcao_nome TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendada', 'finalizada')),
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMPTZ,
  concluida_por UUID,
  observacoes TEXT,
  data_carregamento DATE,
  hora_carregamento TIME,
  responsavel_carregamento_id UUID,
  responsavel_carregamento_nome TEXT,
  carregamento_concluido BOOLEAN NOT NULL DEFAULT false,
  endereco TEXT,
  cidade TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT '',
  cep TEXT,
  telefone_cliente TEXT,
  vezes_agendado INTEGER NOT NULL DEFAULT 0,
  tipo_carregamento public.tipo_carregamento DEFAULT 'elisa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.correcoes ENABLE ROW LEVEL SECURITY;

-- Permissive policy for authenticated users
CREATE POLICY "Authenticated users can manage correcoes"
  ON public.correcoes
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_correcoes_updated_at
  BEFORE UPDATE ON public.correcoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for vezes_agendado (similar to instalacoes)
CREATE OR REPLACE FUNCTION public.increment_correcoes_vezes_agendado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_correcao IS NOT NULL AND (OLD.data_correcao IS NULL OR NEW.data_correcao IS DISTINCT FROM OLD.data_correcao) THEN
    NEW.vezes_agendado := COALESCE(OLD.vezes_agendado, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_correcoes_vezes_agendado
  BEFORE UPDATE ON public.correcoes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_correcoes_vezes_agendado();
