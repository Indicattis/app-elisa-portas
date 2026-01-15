-- Tabela para critérios de negociação dos autorizados
CREATE TABLE public.criterios_negociacao_autorizados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  autorizado_id UUID NOT NULL REFERENCES public.autorizados(id) ON DELETE CASCADE,
  criterio TEXT NOT NULL,
  valor TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coluna de observações na tabela autorizados
ALTER TABLE public.autorizados 
ADD COLUMN IF NOT EXISTS observacoes_negociacao TEXT;

-- Índice para performance
CREATE INDEX idx_criterios_negociacao_autorizado 
ON public.criterios_negociacao_autorizados(autorizado_id);

-- RLS
ALTER TABLE public.criterios_negociacao_autorizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar critérios"
ON public.criterios_negociacao_autorizados FOR SELECT TO authenticated USING (true);

CREATE POLICY "Todos podem inserir critérios"
ON public.criterios_negociacao_autorizados FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Todos podem atualizar critérios"
ON public.criterios_negociacao_autorizados FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Todos podem deletar critérios"
ON public.criterios_negociacao_autorizados FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_criterios_negociacao_updated_at
BEFORE UPDATE ON public.criterios_negociacao_autorizados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();