-- Criar tabela para investimentos em marketing
CREATE TABLE public.marketing_investimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes DATE NOT NULL,
  investimento_google_ads NUMERIC DEFAULT 0,
  investimento_meta_ads NUMERIC DEFAULT 0,
  investimento_linkedin_ads NUMERIC DEFAULT 0,
  outros_investimentos NUMERIC DEFAULT 0,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mes) -- Um registro por mês
);

-- Habilitar RLS
ALTER TABLE public.marketing_investimentos ENABLE ROW LEVEL SECURITY;

-- Política para admins e gerentes comerciais verem dados
CREATE POLICY "Admins e gerentes podem ver investimentos" 
ON public.marketing_investimentos 
FOR SELECT 
USING (is_admin() OR EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
));

-- Política para admins e gerentes comerciais criarem dados
CREATE POLICY "Admins e gerentes podem criar investimentos" 
ON public.marketing_investimentos 
FOR INSERT 
WITH CHECK ((is_admin() OR EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
)) AND created_by = auth.uid());

-- Política para admins e gerentes comerciais atualizarem dados
CREATE POLICY "Admins e gerentes podem atualizar investimentos" 
ON public.marketing_investimentos 
FOR UPDATE 
USING (is_admin() OR EXISTS (
  SELECT 1 FROM public.admin_users 
  WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_marketing_investimentos_updated_at
BEFORE UPDATE ON public.marketing_investimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();