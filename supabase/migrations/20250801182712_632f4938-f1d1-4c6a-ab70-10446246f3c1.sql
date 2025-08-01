-- Criar tabela para salvar posições do organograma
CREATE TABLE public.organograma_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_x NUMERIC NOT NULL,
  position_y NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Criar tabela para salvar conexões do organograma
CREATE TABLE public.organograma_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(source_user_id, target_user_id)
);

-- Habilitar RLS
ALTER TABLE public.organograma_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organograma_connections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para organograma_positions
CREATE POLICY "Admins podem gerenciar posições" ON public.organograma_positions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Usuários autenticados podem ver posições" ON public.organograma_positions
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- Políticas RLS para organograma_connections
CREATE POLICY "Admins podem gerenciar conexões" ON public.organograma_connections
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Usuários autenticados podem ver conexões" ON public.organograma_connections
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organograma_positions_updated_at
BEFORE UPDATE ON public.organograma_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();