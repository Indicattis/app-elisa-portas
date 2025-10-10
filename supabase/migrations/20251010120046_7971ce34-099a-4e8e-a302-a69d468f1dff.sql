-- Criar tabela de atas de reunião
CREATE TABLE public.atas_reuniao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  duracao_segundos INTEGER NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de participantes das atas
CREATE TABLE public.atas_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ata_id UUID NOT NULL REFERENCES public.atas_reuniao(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ata_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.atas_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atas_participantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para atas_reuniao
CREATE POLICY "Authenticated users can view atas"
  ON public.atas_reuniao
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create atas"
  ON public.atas_reuniao
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Políticas RLS para atas_participantes
CREATE POLICY "Authenticated users can view participants"
  ON public.atas_participantes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add participants"
  ON public.atas_participantes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at em atas_reuniao
CREATE TRIGGER update_atas_reuniao_updated_at
  BEFORE UPDATE ON public.atas_reuniao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir nova aba no sistema
INSERT INTO public.app_tabs (
  key,
  label,
  href,
  icon,
  tab_group,
  parent_key,
  sort_order,
  active,
  permission
) VALUES (
  'diario_bordo',
  'Diário de Bordo',
  '/dashboard/diario-bordo',
  'BookOpen',
  'sidebar',
  NULL,
  100,
  true,
  'diario_bordo'::app_permission
);