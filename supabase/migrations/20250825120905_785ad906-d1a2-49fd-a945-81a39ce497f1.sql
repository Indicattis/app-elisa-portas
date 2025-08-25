-- Criar tabelas específicas para cada tipo de ordem de produção

-- Tabela para ordens de soldagem
CREATE TABLE public.ordens_soldagem (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL,
  numero_ordem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel_id UUID,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  produtos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela para ordens de pintura
CREATE TABLE public.ordens_pintura (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL,
  numero_ordem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel_id UUID,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  cor_principal TEXT,
  tipo_tinta TEXT,
  produtos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela para ordens de separação
CREATE TABLE public.ordens_separacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL,
  numero_ordem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel_id UUID,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  produtos JSONB DEFAULT '[]'::jsonb,
  materiais_separados JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela para ordens de perfiladeira
CREATE TABLE public.ordens_perfiladeira (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL,
  numero_ordem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel_id UUID,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  produtos JSONB DEFAULT '[]'::jsonb,
  perfis_produzidos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela para ordens de instalação
CREATE TABLE public.ordens_instalacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL,
  numero_ordem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  responsavel_id UUID,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  endereco_instalacao TEXT,
  data_agendada DATE,
  equipe_instalacao TEXT,
  produtos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.ordens_soldagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_pintura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_separacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_perfiladeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_instalacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ordens de soldagem
CREATE POLICY "Gerentes fabris e admins podem ver ordens de soldagem"
ON public.ordens_soldagem FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar ordens de soldagem"
ON public.ordens_soldagem FOR INSERT
WITH CHECK (
  (is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )) AND created_by = auth.uid()
);

CREATE POLICY "Gerentes fabris e admins podem atualizar ordens de soldagem"
ON public.ordens_soldagem FOR UPDATE
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Políticas RLS para ordens de pintura
CREATE POLICY "Gerentes fabris e admins podem ver ordens de pintura"
ON public.ordens_pintura FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar ordens de pintura"
ON public.ordens_pintura FOR INSERT
WITH CHECK (
  (is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )) AND created_by = auth.uid()
);

CREATE POLICY "Gerentes fabris e admins podem atualizar ordens de pintura"
ON public.ordens_pintura FOR UPDATE
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Políticas RLS para ordens de separação
CREATE POLICY "Gerentes fabris e admins podem ver ordens de separação"
ON public.ordens_separacao FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar ordens de separação"
ON public.ordens_separacao FOR INSERT
WITH CHECK (
  (is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )) AND created_by = auth.uid()
);

CREATE POLICY "Gerentes fabris e admins podem atualizar ordens de separação"
ON public.ordens_separacao FOR UPDATE
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Políticas RLS para ordens de perfiladeira
CREATE POLICY "Gerentes fabris e admins podem ver ordens de perfiladeira"
ON public.ordens_perfiladeira FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar ordens de perfiladeira"
ON public.ordens_perfiladeira FOR INSERT
WITH CHECK (
  (is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )) AND created_by = auth.uid()
);

CREATE POLICY "Gerentes fabris e admins podem atualizar ordens de perfiladeira"
ON public.ordens_perfiladeira FOR UPDATE
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Políticas RLS para ordens de instalação
CREATE POLICY "Gerentes fabris e admins podem ver ordens de instalação"
ON public.ordens_instalacao FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

CREATE POLICY "Gerentes fabris e admins podem criar ordens de instalação"
ON public.ordens_instalacao FOR INSERT
WITH CHECK (
  (is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )) AND created_by = auth.uid()
);

CREATE POLICY "Gerentes fabris e admins podem atualizar ordens de instalação"
ON public.ordens_instalacao FOR UPDATE
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND ativo = true 
    AND role IN ('gerente_fabril', 'gerente_comercial')
  )
);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_ordens_soldagem_updated_at
  BEFORE UPDATE ON public.ordens_soldagem
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_pintura_updated_at
  BEFORE UPDATE ON public.ordens_pintura
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_separacao_updated_at
  BEFORE UPDATE ON public.ordens_separacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_perfiladeira_updated_at
  BEFORE UPDATE ON public.ordens_perfiladeira
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_instalacao_updated_at
  BEFORE UPDATE ON public.ordens_instalacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar número de ordem
CREATE OR REPLACE FUNCTION public.gerar_numero_ordem(tipo_ordem text, pedido_numero text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN pedido_numero || '-' || UPPER(tipo_ordem) || '-' || LPAD(extract(epoch from now())::text, 10, '0');
END;
$$;