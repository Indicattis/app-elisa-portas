-- Criar tabela para registrar autorizações de desconto em vendas
CREATE TABLE public.vendas_autorizacoes_desconto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  percentual_desconto NUMERIC NOT NULL,
  autorizado_por UUID NOT NULL REFERENCES public.admin_users(user_id),
  solicitado_por UUID NOT NULL REFERENCES public.admin_users(user_id),
  senha_usada TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT
);

-- Habilitar RLS
ALTER TABLE public.vendas_autorizacoes_desconto ENABLE ROW LEVEL SECURITY;

-- Política para autenticados visualizarem
CREATE POLICY "Authenticated users can view autorizacoes"
ON public.vendas_autorizacoes_desconto
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Política para autenticados criarem
CREATE POLICY "Authenticated users can create autorizacoes"
ON public.vendas_autorizacoes_desconto
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Índice para buscar por venda
CREATE INDEX idx_vendas_autorizacoes_venda_id ON public.vendas_autorizacoes_desconto(venda_id);

-- Índice para buscar por autorizador
CREATE INDEX idx_vendas_autorizacoes_autorizado_por ON public.vendas_autorizacoes_desconto(autorizado_por);