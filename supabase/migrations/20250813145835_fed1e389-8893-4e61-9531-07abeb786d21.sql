-- Primeiro, criar uma tabela temporária para backup dos dados existentes
CREATE TABLE IF NOT EXISTS orcamentos_backup AS 
SELECT * FROM orcamentos;

-- Remover a tabela atual
DROP TABLE IF EXISTS orcamentos CASCADE;

-- Recriar a tabela orcamentos com estrutura simplificada
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Relacionamentos
  lead_id UUID REFERENCES public.elisaportas_leads(id),
  atendente_id UUID REFERENCES public.admin_users(user_id),
  
  -- Dados do cliente
  cliente_nome TEXT NOT NULL,
  cliente_cpf TEXT,
  cliente_telefone TEXT,
  cliente_email TEXT,
  cliente_estado TEXT,
  cliente_cidade TEXT,
  cliente_bairro TEXT,
  cliente_cep TEXT,
  
  -- Valores
  valor_produto NUMERIC NOT NULL DEFAULT 0,
  valor_pintura NUMERIC NOT NULL DEFAULT 0,
  valor_frete NUMERIC NOT NULL DEFAULT 0,
  valor_instalacao NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  
  -- Desconto
  desconto_percentual INTEGER DEFAULT 0,
  
  -- Detalhes do orçamento
  forma_pagamento TEXT NOT NULL,
  modalidade_instalacao TEXT DEFAULT 'instalacao_elisa',
  
  -- Status e aprovação
  status TEXT NOT NULL DEFAULT 'pendente',
  requer_analise BOOLEAN NOT NULL DEFAULT false,
  motivo_analise TEXT,
  aprovado_por UUID,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  
  -- Classificação automática
  classe INTEGER,
  
  -- Campos personalizados para flexibilidade
  campos_personalizados JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS
CREATE POLICY "Usuários autenticados podem criar orçamentos" 
ON public.orcamentos 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND atendente_id = auth.uid());

CREATE POLICY "Usuários podem ver orçamentos dos leads que têm acesso" 
ON public.orcamentos 
FOR SELECT 
TO authenticated
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.elisaportas_leads 
    WHERE elisaportas_leads.id = orcamentos.lead_id 
    AND (elisaportas_leads.atendente_id = auth.uid() OR elisaportas_leads.atendente_id IS NULL)
  )
);

CREATE POLICY "Usuários podem editar próprios orçamentos" 
ON public.orcamentos 
FOR UPDATE 
TO authenticated
USING (atendente_id = auth.uid() OR is_admin());

CREATE POLICY "Gerentes podem aprovar orçamentos" 
ON public.orcamentos 
FOR UPDATE 
TO authenticated
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.ativo = true 
    AND admin_users.role = 'gerente_comercial'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para calcular classe automaticamente
CREATE TRIGGER update_orcamento_classe
  BEFORE INSERT OR UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_classe_orcamento();

-- Migrar dados da tabela backup para a nova estrutura (apenas dados essenciais)
INSERT INTO public.orcamentos (
  id, created_at, updated_at, lead_id, atendente_id,
  cliente_nome, cliente_cpf, cliente_telefone, cliente_estado, 
  cliente_cidade, cliente_bairro, cliente_cep,
  valor_produto, valor_pintura, valor_frete, valor_instalacao, valor_total,
  desconto_percentual, forma_pagamento, modalidade_instalacao,
  status, requer_analise, motivo_analise, aprovado_por, data_aprovacao,
  classe, campos_personalizados
)
SELECT 
  id, created_at, updated_at, lead_id, atendente_id,
  COALESCE(cliente_nome, ''), cliente_cpf, cliente_telefone, cliente_estado,
  cliente_cidade, cliente_bairro, cliente_cep,
  COALESCE(valor_produto, 0), COALESCE(valor_pintura, 0), 
  COALESCE(valor_frete, 0), COALESCE(valor_instalacao, 0), COALESCE(valor_total, 0),
  COALESCE(desconto_percentual, 0), COALESCE(forma_pagamento, ''), 
  COALESCE(modalidade_instalacao, 'instalacao_elisa'),
  COALESCE(status, 'pendente'), COALESCE(requer_analise, false), 
  motivo_analise, aprovado_por, data_aprovacao,
  classe, COALESCE(campos_personalizados, '{}'::jsonb)
FROM orcamentos_backup
WHERE cliente_nome IS NOT NULL AND forma_pagamento IS NOT NULL;

-- Remover tabela de backup
DROP TABLE orcamentos_backup;