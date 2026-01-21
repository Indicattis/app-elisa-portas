-- Criar tabela neo_instalacoes para serviços avulsos de instalação
CREATE TABLE public.neo_instalacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  data_instalacao DATE,
  hora TIME,
  descricao TEXT,
  equipe_id UUID REFERENCES public.equipes_instalacao(id),
  equipe_nome TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMPTZ,
  concluida_por UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_neo_instalacoes_data ON public.neo_instalacoes(data_instalacao);
CREATE INDEX idx_neo_instalacoes_equipe ON public.neo_instalacoes(equipe_id);
CREATE INDEX idx_neo_instalacoes_status ON public.neo_instalacoes(status);
CREATE INDEX idx_neo_instalacoes_concluida ON public.neo_instalacoes(concluida);

-- Habilitar RLS
ALTER TABLE public.neo_instalacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem visualizar neo_instalacoes"
ON public.neo_instalacoes
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar neo_instalacoes"
ON public.neo_instalacoes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar neo_instalacoes"
ON public.neo_instalacoes
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Criador pode deletar neo_instalacoes"
ON public.neo_instalacoes
FOR DELETE
USING (auth.uid() = created_by);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_neo_instalacoes_updated_at
BEFORE UPDATE ON public.neo_instalacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();