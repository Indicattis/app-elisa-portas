-- Criar tabela de postagens para o cronograma de marketing
CREATE TABLE public.postagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  link_post TEXT,
  data_postagem DATE NOT NULL,
  plataforma TEXT DEFAULT 'instagram',
  curtidas INTEGER DEFAULT 0,
  visualizacoes INTEGER DEFAULT 0,
  comentarios INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.postagens ENABLE ROW LEVEL SECURITY;

-- Policy para usuários autenticados gerenciarem postagens
CREATE POLICY "Authenticated users can manage postagens" 
ON public.postagens 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Criar índices para melhor performance
CREATE INDEX idx_postagens_data ON public.postagens(data_postagem);
CREATE INDEX idx_postagens_plataforma ON public.postagens(plataforma);
CREATE INDEX idx_postagens_created_by ON public.postagens(created_by);

-- Função para atualizar updated_at automaticamente
CREATE TRIGGER update_postagens_updated_at
BEFORE UPDATE ON public.postagens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar rotas no app_routes
INSERT INTO public.app_routes (key, label, path, icon, parent_key, "group", interface, sort_order, active) VALUES
('cronograma_postagens', 'Cronograma', '/dashboard/marketing/cronograma', 'Calendar', 'marketing', 'marketing', 'dashboard', 9, true),
('postagens', 'Postagens', '/dashboard/marketing/postagens', 'Video', 'marketing', 'marketing', 'dashboard', 10, true);