-- Criar tabela de requisições de compra
CREATE TABLE public.requisicoes_compra (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_requisicao text NOT NULL UNIQUE,
  fornecedor_id uuid REFERENCES public.fornecedores(id),
  status text NOT NULL DEFAULT 'pendente_aprovacao' CHECK (status IN ('pendente_aprovacao', 'aprovada', 'rejeitada', 'em_cotacao', 'pedido_realizado', 'concluida')),
  solicitante_id uuid REFERENCES auth.users(id),
  data_necessidade date,
  observacoes text,
  motivo_rejeicao text,
  aprovado_por uuid REFERENCES auth.users(id),
  data_aprovacao timestamp with time zone,
  valor_total numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Criar tabela de itens da requisição
CREATE TABLE public.requisicoes_compra_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisicao_id uuid NOT NULL REFERENCES public.requisicoes_compra(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.estoque(id),
  quantidade integer NOT NULL CHECK (quantidade > 0),
  preco_unitario numeric DEFAULT 0,
  preco_total numeric DEFAULT 0,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requisicoes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes_compra_itens ENABLE ROW LEVEL SECURITY;

-- Policies para requisicoes_compra
CREATE POLICY "Authenticated users can view requisicoes_compra"
ON public.requisicoes_compra
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create requisicoes_compra"
ON public.requisicoes_compra
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND solicitante_id = auth.uid());

CREATE POLICY "Authenticated users can update requisicoes_compra"
ON public.requisicoes_compra
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete requisicoes_compra"
ON public.requisicoes_compra
FOR DELETE
USING (is_admin());

-- Policies para requisicoes_compra_itens
CREATE POLICY "Authenticated users can view requisicoes_compra_itens"
ON public.requisicoes_compra_itens
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create requisicoes_compra_itens"
ON public.requisicoes_compra_itens
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update requisicoes_compra_itens"
ON public.requisicoes_compra_itens
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete requisicoes_compra_itens"
ON public.requisicoes_compra_itens
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Criar índices
CREATE INDEX idx_requisicoes_compra_status ON public.requisicoes_compra(status);
CREATE INDEX idx_requisicoes_compra_fornecedor ON public.requisicoes_compra(fornecedor_id);
CREATE INDEX idx_requisicoes_compra_solicitante ON public.requisicoes_compra(solicitante_id);
CREATE INDEX idx_requisicoes_compra_itens_requisicao ON public.requisicoes_compra_itens(requisicao_id);
CREATE INDEX idx_requisicoes_compra_itens_produto ON public.requisicoes_compra_itens(produto_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_requisicoes_compra_updated_at
BEFORE UPDATE ON public.requisicoes_compra
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de requisição
CREATE OR REPLACE FUNCTION gerar_numero_requisicao()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  proximo_numero INTEGER;
  ano_atual TEXT;
BEGIN
  ano_atual := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_requisicao FROM '^REQ-' || ano_atual || '-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO proximo_numero
  FROM requisicoes_compra
  WHERE numero_requisicao LIKE 'REQ-' || ano_atual || '-%';
  
  RETURN 'REQ-' || ano_atual || '-' || LPAD(proximo_numero::TEXT, 4, '0');
END;
$$;

-- Inserir controle de numeração se não existir
INSERT INTO numeracao_controle (tipo, proximo_numero)
VALUES ('requisicao_compra', 1)
ON CONFLICT (tipo) DO NOTHING;