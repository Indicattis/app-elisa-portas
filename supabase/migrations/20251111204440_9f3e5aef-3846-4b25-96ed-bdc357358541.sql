-- Criar tabela de tarefas
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  responsavel_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida')),
  recorrente BOOLEAN NOT NULL DEFAULT false,
  dia_recorrencia INTEGER,
  tipo_recorrencia TEXT,
  template_id UUID,
  setor TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de templates de tarefas recorrentes
CREATE TABLE IF NOT EXISTS public.tarefas_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  responsavel_id UUID NOT NULL,
  setor TEXT,
  tipo_recorrencia TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  data_proxima_criacao DATE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de conclusão de tarefas recorrentes
CREATE TABLE IF NOT EXISTS public.tarefas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.tarefas_templates(id) ON DELETE CASCADE,
  tarefa_id UUID NOT NULL,
  data_conclusao TIMESTAMPTZ NOT NULL,
  concluida_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_historico ENABLE ROW LEVEL SECURITY;

-- Policies para tarefas
CREATE POLICY "Authenticated users can view tarefas"
  ON public.tarefas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert tarefas"
  ON public.tarefas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tarefas"
  ON public.tarefas FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tarefas"
  ON public.tarefas FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Policies para tarefas_templates
CREATE POLICY "Authenticated users can view tarefas_templates"
  ON public.tarefas_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert tarefas_templates"
  ON public.tarefas_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tarefas_templates"
  ON public.tarefas_templates FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tarefas_templates"
  ON public.tarefas_templates FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Policies para tarefas_historico
CREATE POLICY "Authenticated users can view tarefas_historico"
  ON public.tarefas_historico FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert tarefas_historico"
  ON public.tarefas_historico FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON public.tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_setor ON public.tarefas(setor);
CREATE INDEX IF NOT EXISTS idx_tarefas_created_at ON public.tarefas(created_at);
CREATE INDEX IF NOT EXISTS idx_tarefas_templates_ativa ON public.tarefas_templates(ativa);
CREATE INDEX IF NOT EXISTS idx_tarefas_templates_proxima_criacao ON public.tarefas_templates(data_proxima_criacao);
CREATE INDEX IF NOT EXISTS idx_tarefas_historico_template ON public.tarefas_historico(template_id);