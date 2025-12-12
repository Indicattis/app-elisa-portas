-- Create table for change requests
CREATE TABLE public.solicitacoes_mudanca_cadastro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  solicitante_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  
  -- Fields that can be changed
  nome_atual TEXT,
  nome_novo TEXT,
  email_atual TEXT,
  email_novo TEXT,
  telefone_atual TEXT,
  telefone_novo TEXT,
  cpf_atual TEXT,
  cpf_novo TEXT,
  data_nascimento_atual DATE,
  data_nascimento_novo DATE,
  role_atual TEXT,
  role_novo TEXT,
  setor_atual TEXT,
  setor_novo TEXT,
  salario_atual NUMERIC,
  salario_novo NUMERIC,
  
  motivo TEXT,
  observacoes_aprovacao TEXT,
  aprovador_id UUID,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solicitacoes_mudanca_cadastro ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view solicitacoes" 
  ON public.solicitacoes_mudanca_cadastro FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create solicitacoes" 
  ON public.solicitacoes_mudanca_cadastro FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update solicitacoes" 
  ON public.solicitacoes_mudanca_cadastro FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Insert route into app_routes
INSERT INTO app_routes (key, path, label, parent_key, icon, sort_order, interface, "group", active)
VALUES (
  'solicitacoes_mudanca_cadastro',
  '/dashboard/administrativo/rh/colaboradores/solicitacoes',
  'Solicitações',
  'colaboradores',
  'FileEdit',
  11,
  'dashboard',
  'administrativo',
  true
);