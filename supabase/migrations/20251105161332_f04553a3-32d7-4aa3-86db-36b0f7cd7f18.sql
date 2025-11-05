-- Criar tabela de membros das equipes de instalação
CREATE TABLE IF NOT EXISTS public.equipes_instalacao_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id UUID NOT NULL REFERENCES public.equipes_instalacao(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(equipe_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.equipes_instalacao_membros ENABLE ROW LEVEL SECURITY;

-- Política de leitura para usuários autenticados
CREATE POLICY "Authenticated users can view equipes_instalacao_membros"
  ON public.equipes_instalacao_membros
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Política de inserção para usuários autenticados
CREATE POLICY "Authenticated users can insert equipes_instalacao_membros"
  ON public.equipes_instalacao_membros
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política de deleção para usuários autenticados
CREATE POLICY "Authenticated users can delete equipes_instalacao_membros"
  ON public.equipes_instalacao_membros
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Criar índices para melhor performance
CREATE INDEX idx_equipes_instalacao_membros_equipe_id ON public.equipes_instalacao_membros(equipe_id);
CREATE INDEX idx_equipes_instalacao_membros_user_id ON public.equipes_instalacao_membros(user_id);