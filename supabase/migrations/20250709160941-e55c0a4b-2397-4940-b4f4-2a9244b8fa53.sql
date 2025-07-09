-- Criar enum para turnos de visita
CREATE TYPE public.turno_visita AS ENUM ('manha', 'tarde', 'noite');

-- Criar enum para status da visita
CREATE TYPE public.status_visita AS ENUM ('agendada', 'concluida', 'cancelada');

-- Criar tabela de visitas técnicas
CREATE TABLE public.visitas_tecnicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.elisaportas_leads(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL,
  data_visita DATE NOT NULL,
  turno public.turno_visita NOT NULL,
  status public.status_visita NOT NULL DEFAULT 'agendada',
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.visitas_tecnicas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver todas as visitas"
ON public.visitas_tecnicas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true
  )
);

CREATE POLICY "Usuários autenticados podem criar visitas"
ON public.visitas_tecnicas
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true
  )
);

CREATE POLICY "Responsáveis e admins podem atualizar visitas"
ON public.visitas_tecnicas
FOR UPDATE
TO authenticated
USING (
  responsavel_id = auth.uid() OR 
  is_admin() OR
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND ativo = true AND role = 'gerente_comercial'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_visitas_tecnicas_updated_at
  BEFORE UPDATE ON public.visitas_tecnicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_visitas_tecnicas_lead_id ON public.visitas_tecnicas(lead_id);
CREATE INDEX idx_visitas_tecnicas_responsavel_id ON public.visitas_tecnicas(responsavel_id);
CREATE INDEX idx_visitas_tecnicas_data_visita ON public.visitas_tecnicas(data_visita);
CREATE INDEX idx_visitas_tecnicas_status ON public.visitas_tecnicas(status);