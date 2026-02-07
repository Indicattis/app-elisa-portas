
CREATE TABLE public.requisicoes_aprovacao_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID NOT NULL REFERENCES admin_users(user_id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
  dados_venda JSONB NOT NULL,
  dados_produtos JSONB NOT NULL,
  dados_pagamento JSONB,
  dados_credito JSONB,
  percentual_desconto NUMERIC NOT NULL,
  tipo_autorizacao TEXT NOT NULL,
  aprovado_por UUID REFERENCES admin_users(user_id),
  venda_id UUID REFERENCES vendas(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.requisicoes_aprovacao_venda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem criar requisicoes" ON public.requisicoes_aprovacao_venda
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins e solicitantes podem ver" ON public.requisicoes_aprovacao_venda
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'administrador' OR bypass_permissions = true))
    OR solicitante_id = auth.uid()
  );

CREATE POLICY "Admins podem atualizar" ON public.requisicoes_aprovacao_venda
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'administrador' OR bypass_permissions = true))
  );

CREATE TRIGGER update_requisicoes_aprovacao_venda_updated_at
  BEFORE UPDATE ON public.requisicoes_aprovacao_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
