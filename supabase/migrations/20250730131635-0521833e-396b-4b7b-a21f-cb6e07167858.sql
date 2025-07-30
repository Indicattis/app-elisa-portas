-- Criar tabela para contas a receber (parcelas de vendas)
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL,
  numero_parcela INTEGER NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  valor_pago NUMERIC DEFAULT 0,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver contas a receber" 
ON public.contas_receber 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true
  )
);

CREATE POLICY "Usuários autenticados podem criar contas a receber" 
ON public.contas_receber 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() AND ativo = true
    )
  )
);

CREATE POLICY "Usuários autenticados podem atualizar contas a receber" 
ON public.contas_receber 
FOR UPDATE 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contas_receber_updated_at
BEFORE UPDATE ON public.contas_receber
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campos na tabela vendas para controle de parcelamento
ALTER TABLE public.vendas 
ADD COLUMN numero_parcelas INTEGER,
ADD COLUMN valor_entrada NUMERIC DEFAULT 0;

-- Atualizar vendas existentes
UPDATE public.vendas 
SET numero_parcelas = 1, valor_entrada = COALESCE(valor_venda, 0)
WHERE numero_parcelas IS NULL;