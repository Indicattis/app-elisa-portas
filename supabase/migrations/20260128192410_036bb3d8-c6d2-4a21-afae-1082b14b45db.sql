-- Criar tabela de configurações de vendas
CREATE TABLE public.configuracoes_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  senha_responsavel text NOT NULL DEFAULT '1qazxsw2',
  senha_master text NOT NULL DEFAULT 'Master@2025',
  responsavel_senha_responsavel_id uuid REFERENCES public.admin_users(user_id),
  responsavel_senha_master_id uuid REFERENCES public.admin_users(user_id),
  limite_desconto_avista numeric NOT NULL DEFAULT 3,
  limite_desconto_presencial numeric NOT NULL DEFAULT 3,
  limite_adicional_responsavel numeric NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_vendas ENABLE ROW LEVEL SECURITY;

-- Política de leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler configurações"
ON public.configuracoes_vendas
FOR SELECT
TO authenticated
USING (true);

-- Política de atualização para administradores (usando bypass_permissions ou role admin)
CREATE POLICY "Administradores podem atualizar configurações"
ON public.configuracoes_vendas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR bypass_permissions = true)
    AND ativo = true
  )
);

-- Política de inserção para administradores
CREATE POLICY "Administradores podem inserir configurações"
ON public.configuracoes_vendas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR bypass_permissions = true)
    AND ativo = true
  )
);

-- Inserir configuração inicial
INSERT INTO public.configuracoes_vendas (
  senha_responsavel,
  senha_master,
  limite_desconto_avista,
  limite_desconto_presencial,
  limite_adicional_responsavel
) VALUES (
  '1qazxsw2',
  'Master@2025',
  3,
  3,
  5
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracoes_vendas_updated_at
BEFORE UPDATE ON public.configuracoes_vendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Constraint para garantir que as senhas são diferentes
ALTER TABLE public.configuracoes_vendas
ADD CONSTRAINT senhas_diferentes CHECK (senha_responsavel != senha_master);