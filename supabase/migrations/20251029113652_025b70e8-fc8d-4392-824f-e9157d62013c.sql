-- Criar tabela para armazenar líderes de setor
CREATE TABLE public.setores_lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor TEXT NOT NULL UNIQUE CHECK (setor IN ('vendas', 'marketing', 'instalacoes', 'fabrica', 'administrativo')),
  lider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atribuido_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_setores_lideres_setor ON public.setores_lideres(setor);
CREATE INDEX idx_setores_lideres_lider ON public.setores_lideres(lider_id);

-- Trigger updated_at
CREATE TRIGGER update_setores_lideres_updated_at
  BEFORE UPDATE ON public.setores_lideres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.setores_lideres ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar líderes de setor
CREATE POLICY "Authenticated users can view setores_lideres"
  ON public.setores_lideres
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas Diretor e Administradores podem gerenciar líderes
CREATE POLICY "Only admins can manage setores_lideres"
  ON public.setores_lideres
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() 
      AND ativo = true 
      AND role IN ('diretor', 'administrador')
    )
  )
  WITH CHECK (
    atribuido_por = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() 
      AND ativo = true 
      AND role IN ('diretor', 'administrador')
    )
  );