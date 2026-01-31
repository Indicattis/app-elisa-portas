-- Tabela de estados para autorizados
CREATE TABLE public.estados_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cidades para autorizados
CREATE TABLE public.cidades_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado_id UUID REFERENCES public.estados_autorizados(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(estado_id, nome)
);

-- Habilitar RLS
ALTER TABLE public.estados_autorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades_autorizados ENABLE ROW LEVEL SECURITY;

-- Políticas para estados
CREATE POLICY "Usuarios autenticados podem ver estados" 
ON public.estados_autorizados 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuarios autenticados podem inserir estados" 
ON public.estados_autorizados 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar estados" 
ON public.estados_autorizados 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuarios autenticados podem excluir estados" 
ON public.estados_autorizados 
FOR DELETE 
TO authenticated 
USING (true);

-- Políticas para cidades
CREATE POLICY "Usuarios autenticados podem ver cidades" 
ON public.cidades_autorizados 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuarios autenticados podem inserir cidades" 
ON public.cidades_autorizados 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar cidades" 
ON public.cidades_autorizados 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuarios autenticados podem excluir cidades" 
ON public.cidades_autorizados 
FOR DELETE 
TO authenticated 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_estados_autorizados_updated_at
BEFORE UPDATE ON public.estados_autorizados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cidades_autorizados_updated_at
BEFORE UPDATE ON public.cidades_autorizados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();