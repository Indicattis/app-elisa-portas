-- Criar tabela de folhas de pagamento
CREATE TABLE public.folhas_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_referencia DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  total_bruto NUMERIC NOT NULL DEFAULT 0,
  total_descontos NUMERIC NOT NULL DEFAULT 0,
  total_liquido NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho',
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens da folha de pagamento
CREATE TABLE public.folha_pagamento_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folha_id UUID NOT NULL REFERENCES public.folhas_pagamento(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES public.admin_users(id),
  colaborador_nome TEXT NOT NULL,
  salario_base NUMERIC NOT NULL DEFAULT 0,
  modalidade_pagamento TEXT,
  horas_adicionais NUMERIC DEFAULT 0,
  valor_hora_adicional NUMERIC DEFAULT 0,
  total_horas_adicionais NUMERIC DEFAULT 0,
  acrescimos NUMERIC DEFAULT 0,
  descontos NUMERIC DEFAULT 0,
  descricao_acrescimos TEXT,
  descricao_descontos TEXT,
  total_bruto NUMERIC NOT NULL DEFAULT 0,
  total_liquido NUMERIC NOT NULL DEFAULT 0,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamento_itens ENABLE ROW LEVEL SECURITY;

-- Políticas para folhas_pagamento
CREATE POLICY "Authenticated users can view folhas_pagamento"
ON public.folhas_pagamento FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create folhas_pagamento"
ON public.folhas_pagamento FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update folhas_pagamento"
ON public.folhas_pagamento FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete folhas_pagamento"
ON public.folhas_pagamento FOR DELETE
USING (is_admin());

-- Políticas para folha_pagamento_itens
CREATE POLICY "Authenticated users can view folha_pagamento_itens"
ON public.folha_pagamento_itens FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create folha_pagamento_itens"
ON public.folha_pagamento_itens FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update folha_pagamento_itens"
ON public.folha_pagamento_itens FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete folha_pagamento_itens"
ON public.folha_pagamento_itens FOR DELETE
USING (is_admin());

-- Inserir rota no sistema
INSERT INTO public.app_routes (key, path, label, parent_key, icon, sort_order, interface, "group", active)
VALUES (
  'folha_pagamento',
  '/dashboard/administrativo/rh/colaboradores/folha-pagamento',
  'Folha de Pagamento',
  'colaboradores',
  'FileText',
  12,
  'dashboard',
  'administrativo',
  true
);