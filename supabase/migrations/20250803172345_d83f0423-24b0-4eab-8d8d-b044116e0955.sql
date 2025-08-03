-- Criar tabela de canais de aquisição
CREATE TABLE public.canais_aquisicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.canais_aquisicao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar canais de aquisição" 
ON public.canais_aquisicao 
FOR ALL 
USING (is_admin());

CREATE POLICY "Usuários autenticados podem ver canais ativos" 
ON public.canais_aquisicao 
FOR SELECT 
USING (ativo = true AND auth.uid() IS NOT NULL);

-- Popular com canais padronizados
INSERT INTO public.canais_aquisicao (nome, ordem) VALUES
('Google', 1),
('Meta (Facebook/Instagram)', 2),
('LinkedIn', 3),
('Indicação', 4),
('Cliente fidelizado', 5),
('Autorizado', 6),
('Outros', 7);

-- Adicionar colunas de relacionamento nas tabelas existentes
ALTER TABLE public.elisaportas_leads 
ADD COLUMN canal_aquisicao_id UUID REFERENCES public.canais_aquisicao(id);

ALTER TABLE public.vendas 
ADD COLUMN canal_aquisicao_id UUID REFERENCES public.canais_aquisicao(id);

-- Migrar dados existentes baseado no mapeamento
UPDATE public.elisaportas_leads 
SET canal_aquisicao_id = (
  SELECT id FROM public.canais_aquisicao 
  WHERE nome = CASE 
    WHEN elisaportas_leads.canal_aquisicao IN ('Facebook', 'Instagram', 'Meta') THEN 'Meta (Facebook/Instagram)'
    WHEN elisaportas_leads.canal_aquisicao = 'Outros' THEN 'Autorizado'
    ELSE elisaportas_leads.canal_aquisicao
  END
  LIMIT 1
);

UPDATE public.vendas 
SET canal_aquisicao_id = (
  SELECT id FROM public.canais_aquisicao 
  WHERE nome = CASE 
    WHEN vendas.canal_aquisicao IN ('Facebook', 'Instagram', 'Meta') THEN 'Meta (Facebook/Instagram)'
    WHEN vendas.canal_aquisicao = 'Outros' THEN 'Autorizado'
    ELSE vendas.canal_aquisicao
  END
  LIMIT 1
);

-- Criar trigger para updated_at
CREATE TRIGGER update_canais_aquisicao_updated_at
  BEFORE UPDATE ON public.canais_aquisicao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();