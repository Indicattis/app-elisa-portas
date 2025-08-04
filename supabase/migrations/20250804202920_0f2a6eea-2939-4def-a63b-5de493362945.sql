-- Criar tabela para histórico de etiquetas dos leads
CREATE TABLE public.lead_etiqueta_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES elisaportas_leads(id) ON DELETE CASCADE,
  tag_id_anterior INTEGER,
  tag_id_novo INTEGER,
  usuario_id UUID NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.lead_etiqueta_historico ENABLE ROW LEVEL SECURITY;

-- Política para visualização
CREATE POLICY "Usuários podem ver histórico de etiquetas dos leads que têm acesso"
ON public.lead_etiqueta_historico
FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM elisaportas_leads
    WHERE elisaportas_leads.id = lead_etiqueta_historico.lead_id
    AND (elisaportas_leads.atendente_id = auth.uid() OR elisaportas_leads.atendente_id IS NULL)
  )
);

-- Política para inserção
CREATE POLICY "Usuários autenticados podem inserir histórico de etiquetas"
ON public.lead_etiqueta_historico
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  usuario_id = auth.uid()
);

-- Criar índice para performance
CREATE INDEX idx_lead_etiqueta_historico_lead_id ON public.lead_etiqueta_historico(lead_id);
CREATE INDEX idx_lead_etiqueta_historico_created_at ON public.lead_etiqueta_historico(created_at DESC);