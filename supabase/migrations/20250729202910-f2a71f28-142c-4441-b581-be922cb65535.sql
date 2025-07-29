-- Criar tabela para produtos no orçamento
CREATE TABLE public.orcamento_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL,
  tipo_produto TEXT NOT NULL CHECK (tipo_produto IN ('porta_enrolar', 'porta_social', 'acessorio', 'manutencao', 'adicional')),
  medidas TEXT, -- Para porta de enrolar e porta social
  cor TEXT, -- Para porta de enrolar e porta social
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.orcamento_produtos ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem produtos dos orçamentos que têm acesso
CREATE POLICY "Usuários podem ver produtos dos orçamentos que têm acesso"
ON public.orcamento_produtos
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orcamentos o
  JOIN public.elisaportas_leads l ON l.id = o.lead_id
  WHERE o.id = orcamento_produtos.orcamento_id
  AND (is_admin() OR l.atendente_id = auth.uid() OR l.atendente_id IS NULL)
));

-- Política para usuários autenticados criarem produtos nos orçamentos
CREATE POLICY "Usuários podem criar produtos nos orçamentos"
ON public.orcamento_produtos
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orcamentos o
  JOIN public.elisaportas_leads l ON l.id = o.lead_id
  WHERE o.id = orcamento_produtos.orcamento_id
  AND (is_admin() OR l.atendente_id = auth.uid() OR l.atendente_id IS NULL)
));

-- Política para usuários atualizarem produtos dos próprios orçamentos
CREATE POLICY "Usuários podem atualizar produtos dos próprios orçamentos"
ON public.orcamento_produtos
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.orcamentos o
  WHERE o.id = orcamento_produtos.orcamento_id
  AND (o.usuario_id = auth.uid() OR is_admin())
));

-- Política para usuários deletarem produtos dos próprios orçamentos
CREATE POLICY "Usuários podem deletar produtos dos próprios orçamentos"
ON public.orcamento_produtos
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.orcamentos o
  WHERE o.id = orcamento_produtos.orcamento_id
  AND (o.usuario_id = auth.uid() OR is_admin())
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orcamento_produtos_updated_at
BEFORE UPDATE ON public.orcamento_produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();