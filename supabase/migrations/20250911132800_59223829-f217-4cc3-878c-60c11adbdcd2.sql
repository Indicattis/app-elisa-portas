-- Adicionar campo para controle de inativação automática
ALTER TABLE public.autorizados 
ADD COLUMN inativado_automaticamente boolean DEFAULT false,
ADD COLUMN data_inativacao_automatica timestamp with time zone;

-- Criar tabela de logs de inativações automáticas
CREATE TABLE public.inativacoes_automaticas_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id uuid NOT NULL REFERENCES public.autorizados(id),
  data_inativacao timestamp with time zone NOT NULL DEFAULT now(),
  dias_sem_avaliacao integer NOT NULL,
  ultima_avaliacao_data timestamp with time zone,
  executado_por uuid REFERENCES public.admin_users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.inativacoes_automaticas_log ENABLE ROW LEVEL SECURITY;

-- Política para admins poderem ver logs
CREATE POLICY "Authenticated users can view inactivation logs"
ON public.inativacoes_automaticas_log
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para admins criarem logs
CREATE POLICY "Authenticated users can create inactivation logs"
ON public.inativacoes_automaticas_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar índices para melhorar performance das consultas
CREATE INDEX idx_autorizados_ratings_autorizado_created ON public.autorizados_ratings(autorizado_id, created_at DESC);
CREATE INDEX idx_autorizados_etapa_ativo ON public.autorizados(etapa, ativo);
CREATE INDEX idx_autorizados_vendedor_ativo ON public.autorizados(vendedor_id, ativo);
CREATE INDEX idx_autorizados_inativado_automaticamente ON public.autorizados(inativado_automaticamente);

-- Trigger para atualizar updated_at na tabela inativacoes_automaticas_log
CREATE TRIGGER update_inativacoes_log_updated_at
BEFORE UPDATE ON public.inativacoes_automaticas_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();