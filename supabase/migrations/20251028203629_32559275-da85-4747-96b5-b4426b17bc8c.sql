-- Adicionar coluna setor na tabela tarefas
ALTER TABLE public.tarefas 
ADD COLUMN setor TEXT;

-- Adicionar índice para performance
CREATE INDEX idx_tarefas_setor ON public.tarefas(setor);

-- Adicionar comentário
COMMENT ON COLUMN public.tarefas.setor IS 'Setor/departamento da tarefa: vendas, marketing, instalacoes, fabrica, administrativo';