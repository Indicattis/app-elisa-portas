-- Criar enum para status de tarefas
CREATE TYPE tarefa_status AS ENUM ('em_andamento', 'concluida');

-- Criar tabela tarefas
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  responsavel_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status tarefa_status NOT NULL DEFAULT 'em_andamento',
  recorrente BOOLEAN NOT NULL DEFAULT false,
  dia_recorrencia INTEGER CHECK (dia_recorrencia >= 1 AND dia_recorrencia <= 31),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_tarefas_responsavel ON public.tarefas(responsavel_id);
CREATE INDEX idx_tarefas_status ON public.tarefas(status);
CREATE INDEX idx_tarefas_created_by ON public.tarefas(created_by);

-- Trigger para updated_at
CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias tarefas
CREATE POLICY "Usuários podem ver suas tarefas"
  ON public.tarefas
  FOR SELECT
  TO authenticated
  USING (responsavel_id = auth.uid());

-- Apenas Diretor e Administradores podem criar tarefas
CREATE POLICY "Diretor e Admin podem criar tarefas"
  ON public.tarefas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() 
      AND ativo = true 
      AND role IN ('diretor', 'administrador')
    )
  );

-- Apenas Diretor e Administradores podem atualizar tarefas OU responsáveis podem marcar como concluída
CREATE POLICY "Atualizar tarefas"
  ON public.tarefas
  FOR UPDATE
  TO authenticated
  USING (
    -- Diretor/Admin podem atualizar tudo
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() 
      AND ativo = true 
      AND role IN ('diretor', 'administrador')
    )
    OR
    -- Responsáveis podem atualizar apenas o status para concluída
    (responsavel_id = auth.uid())
  );

-- Apenas Diretor e Administradores podem deletar tarefas
CREATE POLICY "Diretor e Admin podem deletar tarefas"
  ON public.tarefas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() 
      AND ativo = true 
      AND role IN ('diretor', 'administrador')
    )
  );