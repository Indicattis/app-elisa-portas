-- Adicionar novas colunas na tabela contas_receber
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS empresa_receptora_id UUID REFERENCES empresas_emissoras(id);
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS comprovante_url TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS comprovante_nome TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS pago_na_instalacao BOOLEAN DEFAULT FALSE;

-- Adicionar novas colunas na tabela vendas
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS empresa_receptora_id UUID REFERENCES empresas_emissoras(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS quantidade_parcelas INTEGER DEFAULT 1;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS intervalo_boletos INTEGER;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS pago_na_instalacao BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS comprovante_url TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS comprovante_nome TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS parcelas_dinheiro INTEGER DEFAULT 1;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor_entrada_dinheiro NUMERIC DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS restante_na_instalacao BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS parcelas_geradas BOOLEAN DEFAULT FALSE;

-- Criar bucket para comprovantes de pagamento se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes-pagamento', 'comprovantes-pagamento', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de comprovantes
CREATE POLICY "Authenticated users can upload comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comprovantes-pagamento' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view comprovantes"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprovantes-pagamento' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete own comprovantes"
ON storage.objects FOR DELETE
USING (bucket_id = 'comprovantes-pagamento' AND auth.uid() IS NOT NULL);