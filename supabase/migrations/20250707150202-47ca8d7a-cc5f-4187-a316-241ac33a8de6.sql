-- Adicionar nova role "gerente_comercial"
ALTER TYPE public.user_role ADD VALUE 'gerente_comercial';

-- Atualizar política RLS para permitir que atendentes vejam todos os leads
DROP POLICY IF EXISTS "Controle de visualização de leads por role" ON public.elisaportas_leads;

CREATE POLICY "Controle de visualização de leads por role" 
ON public.elisaportas_leads 
FOR SELECT 
USING (
  is_admin() OR 
  (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.ativo = true 
    AND admin_users.role IN ('atendente'::user_role, 'gerente_comercial'::user_role)
  ))
);

-- Adicionar status "Vendido" (status 5)
-- Não precisa alterar a tabela, apenas usar o novo valor

-- Criar tabela de vendas
CREATE TABLE public.vendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.elisaportas_leads(id),
  atendente_id UUID NOT NULL,
  valor_venda NUMERIC NOT NULL,
  forma_pagamento TEXT,
  observacoes_venda TEXT,
  data_venda TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS na tabela vendas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Política para visualização de vendas (Admin e Gerente comercial)
CREATE POLICY "Admins e gerentes podem ver vendas" 
ON public.vendas 
FOR SELECT 
USING (
  is_admin() OR 
  (EXISTS ( 
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.ativo = true 
    AND admin_users.role = 'gerente_comercial'::user_role
  ))
);

-- Política para inserção de vendas (usuários autenticados)
CREATE POLICY "Usuários autenticados podem inserir vendas" 
ON public.vendas 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para iniciar atendimento
CREATE OR REPLACE FUNCTION public.iniciar_atendimento(lead_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é atendente ou admin
  IF NOT (is_admin() OR EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role IN ('atendente'::user_role, 'gerente_comercial'::user_role)
  )) THEN
    RETURN false;
  END IF;

  -- Verificar se o lead está disponível para atendimento (status 1)
  IF NOT EXISTS (
    SELECT 1 FROM public.elisaportas_leads 
    WHERE id = lead_uuid AND status_atendimento = 1
  ) THEN
    RETURN false;
  END IF;

  -- Atualizar lead para em andamento
  UPDATE public.elisaportas_leads 
  SET status_atendimento = 2,
      atendente_id = auth.uid(),
      data_inicio_atendimento = now(),
      updated_at = now()
  WHERE id = lead_uuid;

  -- Registrar no histórico
  INSERT INTO public.lead_atendimento_historico (
    lead_id,
    atendente_id,
    acao,
    status_anterior,
    status_novo
  ) VALUES (
    lead_uuid,
    auth.uid(),
    'iniciou_atendimento',
    1, -- Aguardando
    2  -- Em andamento
  );

  RETURN true;
END;
$$;

-- Função para finalizar venda
CREATE OR REPLACE FUNCTION public.finalizar_venda(
  lead_uuid uuid,
  valor_venda numeric,
  forma_pagamento text DEFAULT NULL,
  observacoes_venda text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário é o atendente do lead ou é admin
  IF NOT (is_admin() OR is_lead_attendant(lead_uuid)) THEN
    RETURN false;
  END IF;

  -- Atualizar status do lead para vendido (5)
  UPDATE public.elisaportas_leads 
  SET status_atendimento = 5,
      data_conclusao_atendimento = now(),
      updated_at = now()
  WHERE id = lead_uuid;

  -- Criar registro de venda
  INSERT INTO public.vendas (
    lead_id,
    atendente_id,
    valor_venda,
    forma_pagamento,
    observacoes_venda
  ) VALUES (
    lead_uuid,
    auth.uid(),
    valor_venda,
    forma_pagamento,
    observacoes_venda
  );

  -- Registrar no histórico
  INSERT INTO public.lead_atendimento_historico (
    lead_id,
    atendente_id,
    acao,
    status_anterior,
    status_novo
  ) VALUES (
    lead_uuid,
    auth.uid(),
    'finalizou_venda',
    2, -- Em andamento
    5  -- Vendido
  );

  RETURN true;
END;
$$;