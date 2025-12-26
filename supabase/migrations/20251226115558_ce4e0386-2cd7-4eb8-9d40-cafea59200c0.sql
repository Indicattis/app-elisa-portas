-- Criar tabela para observações de Porta Social
CREATE TABLE pedido_porta_social_observacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_producao(id) ON DELETE CASCADE,
  produto_venda_id UUID NOT NULL REFERENCES produtos_vendas(id) ON DELETE CASCADE,
  indice_porta INTEGER NOT NULL DEFAULT 0,
  
  -- Medidas da porta
  altura_menor_porta NUMERIC,
  espessura_parede NUMERIC,
  largura_1 NUMERIC,
  largura_2 NUMERIC,
  largura_3 NUMERIC,
  largura_menor_porta NUMERIC,
  
  -- Painel
  tem_painel BOOLEAN DEFAULT false,
  largura_painel NUMERIC,
  altura_painel NUMERIC,
  
  -- Configurações
  lado_fechadura TEXT CHECK (lado_fechadura IN ('direita', 'esquerda')),
  lado_abertura TEXT CHECK (lado_abertura IN ('fora', 'dentro')),
  acabamento TEXT CHECK (acabamento IN ('perfil_u', 'normal')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(pedido_id, produto_venda_id, indice_porta)
);

-- Enable RLS
ALTER TABLE pedido_porta_social_observacoes ENABLE ROW LEVEL SECURITY;

-- Policy para usuários autenticados
CREATE POLICY "Authenticated users can manage porta_social_observacoes" 
ON pedido_porta_social_observacoes
FOR ALL USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_porta_social_observacoes_updated_at
  BEFORE UPDATE ON pedido_porta_social_observacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pedido_linhas_updated_at();