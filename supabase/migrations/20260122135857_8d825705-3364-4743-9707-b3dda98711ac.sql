-- Criar tabela para responsáveis por etapa
CREATE TABLE public.etapa_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa TEXT NOT NULL UNIQUE,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.etapa_responsaveis ENABLE ROW LEVEL SECURITY;

-- Policy para leitura (todos podem ver)
CREATE POLICY "Leitura pública de responsáveis por etapa" 
ON public.etapa_responsaveis 
FOR SELECT 
USING (true);

-- Policy para inserção (usuários autenticados)
CREATE POLICY "Usuários autenticados podem inserir responsáveis" 
ON public.etapa_responsaveis 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy para atualização (usuários autenticados)
CREATE POLICY "Usuários autenticados podem atualizar responsáveis" 
ON public.etapa_responsaveis 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Policy para exclusão (usuários autenticados)
CREATE POLICY "Usuários autenticados podem excluir responsáveis" 
ON public.etapa_responsaveis 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_etapa_responsaveis_updated_at
BEFORE UPDATE ON public.etapa_responsaveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();