
-- Adicionar campos de status e análise aos orçamentos
ALTER TABLE public.orcamentos 
ADD COLUMN status TEXT NOT NULL DEFAULT 'aprovado' CHECK (status IN ('pendente', 'aprovado', 'reprovado')),
ADD COLUMN requer_analise BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN aprovado_por UUID,
ADD COLUMN data_aprovacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN desconto_adicional_percentual INTEGER DEFAULT 0 CHECK (desconto_adicional_percentual >= 0 AND desconto_adicional_percentual <= 20),
ADD COLUMN observacoes_aprovacao TEXT;

-- Atualizar políticas para gerentes poderem aprovar orçamentos
CREATE POLICY "Gerentes podem aprovar orçamentos"
ON public.orcamentos
FOR UPDATE
USING (
  is_admin() OR 
  (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  ))
);

-- Função para verificar se lead pode ser marcado como vendido
CREATE OR REPLACE FUNCTION public.pode_marcar_venda(lead_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  tem_requisicao_pendente boolean;
  tem_orcamento_aprovado boolean;
BEGIN
  -- Verificar se há requisição pendente
  SELECT EXISTS (
    SELECT 1 FROM public.requisicoes_venda 
    WHERE lead_id = lead_uuid AND status = 'pendente'
  ) INTO tem_requisicao_pendente;
  
  -- Se tem requisição pendente, não pode marcar venda
  IF tem_requisicao_pendente THEN
    RETURN false;
  END IF;
  
  -- Verificar se há orçamento aprovado
  SELECT EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE lead_id = lead_uuid AND status = 'aprovado'
  ) INTO tem_orcamento_aprovado;
  
  -- Só pode marcar venda se tiver orçamento aprovado
  RETURN tem_orcamento_aprovado;
END;
$$;

-- Função para aprovar orçamento
CREATE OR REPLACE FUNCTION public.aprovar_orcamento(
  orcamento_uuid uuid,
  desconto_adicional integer DEFAULT 0,
  observacoes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valor_produto_atual numeric;
  desconto_original integer;
  desconto_total integer;
  novo_valor_total numeric;
BEGIN
  -- Verificar se é gerente ou admin
  IF NOT (is_admin() OR EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  )) THEN
    RETURN false;
  END IF;

  -- Obter valores atuais
  SELECT valor_produto, desconto_percentual 
  INTO valor_produto_atual, desconto_original
  FROM public.orcamentos 
  WHERE id = orcamento_uuid AND status = 'pendente';
  
  IF valor_produto_atual IS NULL THEN
    RETURN false;
  END IF;

  -- Calcular novo valor total com desconto adicional
  desconto_total := desconto_original + desconto_adicional;
  
  -- Recalcular valor total
  SELECT (
    valor_produto + valor_pintura + valor_frete + valor_instalacao + 
    COALESCE((
      SELECT SUM(value::numeric) 
      FROM jsonb_each_text(campos_personalizados)
    ), 0)
  ) - (valor_produto_atual * desconto_total / 100)
  INTO novo_valor_total
  FROM public.orcamentos 
  WHERE id = orcamento_uuid;

  -- Atualizar orçamento
  UPDATE public.orcamentos 
  SET 
    status = 'aprovado',
    aprovado_por = auth.uid(),
    data_aprovacao = now(),
    desconto_adicional_percentual = desconto_adicional,
    desconto_percentual = desconto_total,
    valor_total = novo_valor_total,
    observacoes_aprovacao = observacoes
  WHERE id = orcamento_uuid;

  RETURN true;
END;
$$;
