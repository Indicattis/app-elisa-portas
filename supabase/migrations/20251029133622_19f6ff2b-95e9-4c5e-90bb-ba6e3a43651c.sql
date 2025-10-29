-- Criar tabela para gerenciar etapas dos pedidos
CREATE TABLE IF NOT EXISTS public.pedidos_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos_producao(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL CHECK (etapa IN (
    'aberto',
    'em_producao', 
    'inspecao_qualidade',
    'aguardando_pintura',
    'aguardando_coleta',
    'aguardando_instalacao',
    'finalizado'
  )),
  checkboxes JSONB DEFAULT '[]'::jsonb,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_saida TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_etapas_pedido ON public.pedidos_etapas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_etapas_etapa ON public.pedidos_etapas(etapa);

-- Adicionar coluna etapa_atual na tabela pedidos_producao
ALTER TABLE public.pedidos_producao 
ADD COLUMN IF NOT EXISTS etapa_atual TEXT DEFAULT 'aberto' 
CHECK (etapa_atual IN (
  'aberto',
  'em_producao',
  'inspecao_qualidade', 
  'aguardando_pintura',
  'aguardando_coleta',
  'aguardando_instalacao',
  'finalizado'
));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_pedidos_etapas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pedidos_etapas_updated_at
  BEFORE UPDATE ON public.pedidos_etapas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pedidos_etapas_updated_at();

-- RLS Policies
ALTER TABLE public.pedidos_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pedidos_etapas"
  ON public.pedidos_etapas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert pedidos_etapas"
  ON public.pedidos_etapas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pedidos_etapas"
  ON public.pedidos_etapas FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Atualizar pedidos existentes para etapa inicial
UPDATE public.pedidos_producao 
SET etapa_atual = 'em_producao' 
WHERE etapa_atual IS NULL;