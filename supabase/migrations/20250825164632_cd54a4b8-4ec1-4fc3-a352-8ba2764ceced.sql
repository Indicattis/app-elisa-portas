-- Criar tabela para linhas das ordens
CREATE TABLE public.linhas_ordens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL,
  tipo_ordem TEXT NOT NULL CHECK (tipo_ordem IN ('separacao', 'perfiladeira', 'soldagem', 'pintura')),
  item TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  tamanho TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.linhas_ordens ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Gerentes fabris e admins podem ver linhas de ordens"
ON public.linhas_ordens
FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar linhas de ordens"
ON public.linhas_ordens
FOR INSERT
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem atualizar linhas de ordens"
ON public.linhas_ordens
FOR UPDATE
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem deletar linhas de ordens"
ON public.linhas_ordens
FOR DELETE
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Criar trigger para updated_at
CREATE TRIGGER update_linhas_ordens_updated_at
  BEFORE UPDATE ON public.linhas_ordens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();