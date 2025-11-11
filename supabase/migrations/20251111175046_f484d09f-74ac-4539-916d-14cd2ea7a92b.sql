-- Criar tabela para gerenciar cargos do sistema
CREATE TABLE IF NOT EXISTS public.system_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  setor text,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar system_roles"
ON public.system_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role = 'administrador'
    AND admin_users.ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role = 'administrador'
    AND admin_users.ativo = true
  )
);

CREATE POLICY "Todos podem visualizar system_roles ativos"
ON public.system_roles
FOR SELECT
TO authenticated
USING (ativo = true);

-- Popular com os cargos existentes
INSERT INTO public.system_roles (key, label, setor, ordem, ativo) VALUES
  ('administrador', 'Administrador', 'administrativo', 1, true),
  ('diretor', 'Diretor', 'administrativo', 2, true),
  ('gerente_comercial', 'Gerente Comercial', 'vendas', 3, true),
  ('gerente_fabril', 'Gerente Fabril', 'fabrica', 4, true),
  ('gerente_marketing', 'Gerente de Marketing', 'marketing', 5, true),
  ('gerente_financeiro', 'Gerente Financeiro', 'administrativo', 6, true),
  ('gerente_producao', 'Gerente de Produção', 'fabrica', 7, true),
  ('gerente_instalacoes', 'Gerente de Instalações', 'instalacoes', 8, true),
  ('coordenador_vendas', 'Coordenador(a) de Vendas', 'vendas', 9, true),
  ('analista_marketing', 'Analista de Marketing', 'marketing', 10, true),
  ('assistente_marketing', 'Assistente de Marketing', 'marketing', 11, true),
  ('assistente_administrativo', 'Assistente Administrativo', 'administrativo', 12, true),
  ('atendente', 'Atendente', 'administrativo', 13, true),
  ('vendedor', 'Vendedor(a)', 'vendas', 14, true),
  ('instalador', 'Instalador', 'instalacoes', 15, true),
  ('aux_instalador', 'Aux. Instalador', 'instalacoes', 16, true),
  ('soldador', 'Soldador', 'fabrica', 17, true),
  ('pintor', 'Pintor(a)', 'fabrica', 18, true),
  ('aux_pintura', 'Aux. Pintura', 'fabrica', 19, true),
  ('aux_geral', 'Aux. Geral', 'fabrica', 20, true)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  setor = EXCLUDED.setor,
  ordem = EXCLUDED.ordem;

-- Índices
CREATE INDEX idx_system_roles_key ON public.system_roles(key);
CREATE INDEX idx_system_roles_ativo ON public.system_roles(ativo);
CREATE INDEX idx_system_roles_setor ON public.system_roles(setor);