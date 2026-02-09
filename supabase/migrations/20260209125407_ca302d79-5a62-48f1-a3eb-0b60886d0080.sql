
-- Criar tabela colaborador_responsabilidades
CREATE TABLE public.colaborador_responsabilidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('funcao', 'obrigacao', 'responsabilidade')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.colaborador_responsabilidades ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND role IN ('admin', 'administrador')
      AND ativo = true
  );
$$;

-- RLS policies
CREATE POLICY "Admins can view all responsabilidades"
ON public.colaborador_responsabilidades FOR SELECT
TO authenticated
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert responsabilidades"
ON public.colaborador_responsabilidades FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update responsabilidades"
ON public.colaborador_responsabilidades FOR UPDATE
TO authenticated
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete responsabilidades"
ON public.colaborador_responsabilidades FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_colaborador_responsabilidades_updated_at
BEFORE UPDATE ON public.colaborador_responsabilidades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
