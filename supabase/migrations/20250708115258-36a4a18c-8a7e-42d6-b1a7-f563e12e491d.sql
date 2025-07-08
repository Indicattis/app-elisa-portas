-- Criar tabela de orçamentos
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.elisaportas_leads(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  valor_produto DECIMAL(10,2) NOT NULL,
  valor_pintura DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_frete DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_instalacao DECIMAL(10,2) NOT NULL DEFAULT 0,
  campos_personalizados JSONB DEFAULT '{}',
  forma_pagamento TEXT NOT NULL,
  desconto_percentual INTEGER DEFAULT 0 CHECK (desconto_percentual IN (0, 5, 10)),
  valor_total DECIMAL(10,2) NOT NULL,
  documento_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de requisições de venda
CREATE TABLE public.requisicoes_venda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.elisaportas_leads(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  solicitante_id UUID NOT NULL,
  gerente_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'reprovada', 'excluida')),
  custo_material DECIMAL(10,2),
  custo_pintura DECIMAL(10,2),
  custo_instalacao DECIMAL(10,2),
  custo_frete DECIMAL(10,2),
  observacoes TEXT,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes_venda ENABLE ROW LEVEL SECURITY;

-- Políticas para orçamentos
CREATE POLICY "Usuários autenticados podem ver orçamentos dos leads que têm acesso"
ON public.orcamentos
FOR SELECT
USING (
  is_admin() OR 
  (EXISTS (
    SELECT 1 FROM public.elisaportas_leads 
    WHERE id = orcamentos.lead_id 
    AND (atendente_id = auth.uid() OR atendente_id IS NULL)
  ))
);

CREATE POLICY "Usuários autenticados podem criar orçamentos"
ON public.orcamentos
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND usuario_id = auth.uid());

CREATE POLICY "Usuários podem editar próprios orçamentos"
ON public.orcamentos
FOR UPDATE
USING (usuario_id = auth.uid() OR is_admin());

-- Políticas para requisições de venda
CREATE POLICY "Gerentes e admins podem ver requisições"
ON public.requisicoes_venda
FOR SELECT
USING (
  is_admin() OR 
  (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  )) OR
  solicitante_id = auth.uid()
);

CREATE POLICY "Usuários autenticados podem criar requisições"
ON public.requisicoes_venda
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND solicitante_id = auth.uid());

CREATE POLICY "Gerentes e admins podem atualizar requisições"
ON public.requisicoes_venda
FOR UPDATE
USING (
  is_admin() OR 
  (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  ))
);

-- Adicionar triggers para updated_at
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requisicoes_venda_updated_at
  BEFORE UPDATE ON public.requisicoes_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar requisição de venda quando lead é marcado como vendido
CREATE OR REPLACE FUNCTION public.criar_requisicao_venda(
  lead_uuid uuid,
  orcamento_uuid uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requisicao_id uuid;
BEGIN
  -- Verificar se o usuário tem permissão
  IF NOT (is_admin() OR is_lead_attendant(lead_uuid)) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para criar requisição de venda';
  END IF;

  -- Criar requisição de venda
  INSERT INTO public.requisicoes_venda (
    lead_id,
    orcamento_id,
    solicitante_id
  ) VALUES (
    lead_uuid,
    orcamento_uuid,
    auth.uid()
  ) RETURNING id INTO requisicao_id;

  RETURN requisicao_id;
END;
$$;