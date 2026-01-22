-- Criar tabela neo_correcoes (similar a neo_instalacoes)
CREATE TABLE public.neo_correcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  data_correcao DATE,
  hora TIME,
  descricao TEXT,
  equipe_id UUID REFERENCES public.equipes_instalacao(id),
  equipe_nome TEXT,
  status TEXT NOT NULL DEFAULT 'agendada',
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMPTZ,
  concluida_por UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neo_correcoes ENABLE ROW LEVEL SECURITY;

-- Policies (similar to neo_instalacoes)
CREATE POLICY "Allow read access to neo_correcoes"
  ON public.neo_correcoes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access to neo_correcoes"
  ON public.neo_correcoes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access to neo_correcoes"
  ON public.neo_correcoes
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete access to neo_correcoes"
  ON public.neo_correcoes
  FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_neo_correcoes_updated_at
  BEFORE UPDATE ON public.neo_correcoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();