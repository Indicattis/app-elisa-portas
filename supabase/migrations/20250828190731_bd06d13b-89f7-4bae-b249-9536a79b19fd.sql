-- Criar tabela para equipes de instalação
CREATE TABLE public.equipes_instalacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  cor TEXT DEFAULT '#3B82F6',
  responsavel_id UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para pontos de instalação no cronograma
CREATE TABLE public.pontos_instalacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID NOT NULL REFERENCES public.equipes_instalacao(id) ON DELETE CASCADE,
  cidade TEXT NOT NULL,
  semana_inicio DATE NOT NULL, -- Data da segunda-feira da semana
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 1=segunda, etc
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(equipe_id, semana_inicio, dia_semana)
);

-- Habilitar RLS
ALTER TABLE public.equipes_instalacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_instalacao ENABLE ROW LEVEL SECURITY;

-- Políticas para equipes_instalacao
CREATE POLICY "Gerentes fabris e admins podem gerenciar equipes de instalação" 
ON public.equipes_instalacao 
FOR ALL 
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Usuários autenticados podem ver equipes ativas" 
ON public.equipes_instalacao 
FOR SELECT 
USING (
  ativa = true AND auth.uid() IS NOT NULL
);

-- Políticas para pontos_instalacao
CREATE POLICY "Gerentes fabris e admins podem gerenciar pontos de instalação" 
ON public.pontos_instalacao 
FOR ALL 
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Usuários autenticados podem ver pontos de instalação" 
ON public.pontos_instalacao 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_equipes_instalacao_updated_at
  BEFORE UPDATE ON public.equipes_instalacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pontos_instalacao_updated_at
  BEFORE UPDATE ON public.pontos_instalacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();