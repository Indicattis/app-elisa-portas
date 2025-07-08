
-- Adicionar campos de endereço à tabela de leads
ALTER TABLE public.elisaportas_leads 
ADD COLUMN endereco_rua TEXT,
ADD COLUMN endereco_numero TEXT,
ADD COLUMN endereco_complemento TEXT,
ADD COLUMN endereco_bairro TEXT,
ADD COLUMN endereco_cep TEXT,
ADD COLUMN endereco_cidade_completa TEXT,
ADD COLUMN endereco_estado TEXT;

-- Adicionar campo para motivo da análise na tabela de orçamentos
ALTER TABLE public.orcamentos 
ADD COLUMN motivo_analise TEXT;

-- Adicionar campo para tipo de desconto (percentual ou valor fixo)
ALTER TABLE public.orcamentos 
ADD COLUMN tipo_desconto_adicional TEXT DEFAULT 'percentual' CHECK (tipo_desconto_adicional IN ('percentual', 'valor')),
ADD COLUMN desconto_adicional_valor NUMERIC DEFAULT 0;

-- Atualizar função de aprovação de orçamento para suportar desconto em valor
CREATE OR REPLACE FUNCTION public.aprovar_orcamento(
  orcamento_uuid uuid,
  desconto_adicional numeric DEFAULT 0,
  tipo_desconto text DEFAULT 'percentual',
  observacoes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valor_base numeric;
  desconto_original integer;
  novo_valor_total numeric;
  orcamento_record record;
BEGIN
  -- Verificar se é gerente ou admin
  IF NOT (is_admin() OR EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  )) THEN
    RETURN false;
  END IF;

  -- Obter dados do orçamento
  SELECT * INTO orcamento_record
  FROM public.orcamentos 
  WHERE id = orcamento_uuid AND status = 'pendente';
  
  IF orcamento_record.id IS NULL THEN
    RETURN false;
  END IF;

  -- Calcular valor base (sem desconto original)
  valor_base := orcamento_record.valor_produto + orcamento_record.valor_pintura + 
                orcamento_record.valor_frete + orcamento_record.valor_instalacao + 
                COALESCE((
                  SELECT SUM(value::numeric) 
                  FROM jsonb_each_text(orcamento_record.campos_personalizados)
                ), 0);

  -- Aplicar desconto original
  novo_valor_total := valor_base - (valor_base * orcamento_record.desconto_percentual / 100);

  -- Aplicar desconto adicional
  IF tipo_desconto = 'percentual' THEN
    novo_valor_total := novo_valor_total - (valor_base * desconto_adicional / 100);
  ELSE
    novo_valor_total := novo_valor_total - desconto_adicional;
  END IF;

  -- Atualizar orçamento
  UPDATE public.orcamentos 
  SET 
    status = 'aprovado',
    aprovado_por = auth.uid(),
    data_aprovacao = now(),
    tipo_desconto_adicional = tipo_desconto,
    desconto_adicional_percentual = CASE WHEN tipo_desconto = 'percentual' THEN desconto_adicional::integer ELSE 0 END,
    desconto_adicional_valor = CASE WHEN tipo_desconto = 'valor' THEN desconto_adicional ELSE 0 END,
    valor_total = novo_valor_total,
    observacoes_aprovacao = observacoes
  WHERE id = orcamento_uuid;

  -- Atualizar valor do orçamento no lead apenas se não houver orçamento aprovado
  UPDATE public.elisaportas_leads 
  SET valor_orcamento = novo_valor_total
  WHERE id = orcamento_record.lead_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.orcamentos 
    WHERE lead_id = orcamento_record.lead_id 
    AND status = 'aprovado' 
    AND id != orcamento_uuid
  );

  RETURN true;
END;
$$;

-- Política para permitir que admins deletem vendas
CREATE POLICY "Admins podem deletar vendas"
ON public.vendas
FOR DELETE
USING (is_admin());

-- Atualizar política de visualização do dashboard para incluir atendentes
DROP POLICY IF EXISTS "Admins e gerentes podem ver vendas" ON public.vendas;
CREATE POLICY "Usuários autenticados podem ver vendas"
ON public.vendas
FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true
  )
);

-- Constraint para garantir apenas um orçamento aprovado por lead
CREATE UNIQUE INDEX idx_unique_approved_budget_per_lead 
ON public.orcamentos (lead_id) 
WHERE status = 'aprovado';
