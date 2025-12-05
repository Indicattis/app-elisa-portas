-- Criar tabela contas_pagar
CREATE TABLE public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  fornecedor_id UUID REFERENCES fornecedores(id),
  fornecedor_nome TEXT,
  empresa_pagadora_id UUID REFERENCES empresas_emissoras(id),
  categoria TEXT NOT NULL DEFAULT 'outros',
  numero_parcela INTEGER NOT NULL DEFAULT 1,
  total_parcelas INTEGER NOT NULL DEFAULT 1,
  valor_parcela NUMERIC NOT NULL,
  valor_pago NUMERIC DEFAULT 0,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  metodo_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  nota_fiscal_url TEXT,
  nota_fiscal_nome TEXT,
  comprovante_url TEXT,
  comprovante_nome TEXT,
  observacoes TEXT,
  grupo_id UUID DEFAULT gen_random_uuid(),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view contas_pagar"
ON public.contas_pagar FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create contas_pagar"
ON public.contas_pagar FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contas_pagar"
ON public.contas_pagar FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete contas_pagar"
ON public.contas_pagar FOR DELETE
USING (is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_contas_pagar_updated_at
BEFORE UPDATE ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.update_empresas_emissoras_updated_at();

-- Criar bucket para arquivos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contas-pagar', 'contas-pagar', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Authenticated users can upload contas-pagar files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contas-pagar' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view contas-pagar files"
ON storage.objects FOR SELECT
USING (bucket_id = 'contas-pagar' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contas-pagar files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'contas-pagar' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contas-pagar files"
ON storage.objects FOR DELETE
USING (bucket_id = 'contas-pagar' AND auth.uid() IS NOT NULL);

-- Inserir rota no app_routes
INSERT INTO app_routes (key, path, label, icon, parent_key, sort_order, interface, active, "group") 
VALUES ('financeiro_contas_pagar', '/dashboard/administrativo/financeiro/contas-a-pagar', 'Contas a Pagar', 'BadgeDollarSign', 'financeiro_home', 35, 'dashboard', true, 'administrativo')
ON CONFLICT (key) DO NOTHING;