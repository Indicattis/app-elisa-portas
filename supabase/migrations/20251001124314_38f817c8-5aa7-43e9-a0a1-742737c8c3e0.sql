-- Adicionar etapa 'premium' ao enum autorizado_etapa
ALTER TYPE autorizado_etapa ADD VALUE IF NOT EXISTS 'premium';

-- Criar tabela de tags de parceiros
CREATE TABLE IF NOT EXISTS public.parceiro_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de atribuição de tags aos parceiros
CREATE TABLE IF NOT EXISTS public.parceiro_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id uuid NOT NULL REFERENCES public.autorizados(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.parceiro_tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parceiro_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.parceiro_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiro_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para parceiro_tags
CREATE POLICY "Authenticated users can view tags"
ON public.parceiro_tags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage tags"
ON public.parceiro_tags
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies para parceiro_tag_assignments
CREATE POLICY "Authenticated users can view tag assignments"
ON public.parceiro_tag_assignments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage tag assignments"
ON public.parceiro_tag_assignments
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_parceiro_tags_updated_at
BEFORE UPDATE ON public.parceiro_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();