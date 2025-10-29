-- Criar tabela pontos_instalacao
CREATE TABLE IF NOT EXISTS public.pontos_instalacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID NOT NULL REFERENCES public.equipes_instalacao(id) ON DELETE CASCADE,
  cidade TEXT NOT NULL,
  semana_inicio DATE NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pontos_instalacao ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view pontos_instalacao"
  ON public.pontos_instalacao FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create pontos_instalacao"
  ON public.pontos_instalacao FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pontos_instalacao"
  ON public.pontos_instalacao FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pontos_instalacao"
  ON public.pontos_instalacao FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_pontos_instalacao_updated_at
  BEFORE UPDATE ON public.pontos_instalacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_pontos_instalacao_equipe ON public.pontos_instalacao(equipe_id);
CREATE INDEX idx_pontos_instalacao_semana ON public.pontos_instalacao(semana_inicio);
CREATE INDEX idx_pontos_instalacao_dia ON public.pontos_instalacao(dia_semana);