-- Adicionar colunas faltantes na tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS motivo_perda text,
ADD COLUMN IF NOT EXISTS justificativa_perda text,
ADD COLUMN IF NOT EXISTS desconto_adicional_percentual integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_adicional_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_desconto_adicional text,
ADD COLUMN IF NOT EXISTS observacoes_aprovacao text;

-- Corrigir constraint na tabela requisicoes_venda para permitir lead_id nulo temporariamente
ALTER TABLE public.requisicoes_venda 
ALTER COLUMN lead_id DROP NOT NULL;

-- Adicionar política RLS para permitir visualização dos produtos do orçamento
DROP POLICY IF EXISTS "Usuários podem visualizar produtos dos orçamentos" ON public.orcamento_produtos;
CREATE POLICY "Usuários podem visualizar produtos dos orçamentos" 
ON public.orcamento_produtos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_produtos.orcamento_id
      AND (o.atendente_id = auth.uid() OR is_admin())
    )
  )
);

-- Permitir atualização de produtos do orçamento
DROP POLICY IF EXISTS "Usuários podem atualizar produtos dos orçamentos" ON public.orcamento_produtos;
CREATE POLICY "Usuários podem atualizar produtos dos orçamentos" 
ON public.orcamento_produtos 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_produtos.orcamento_id
      AND o.atendente_id = auth.uid()
    )
  )
);

-- Permitir exclusão de produtos do orçamento
DROP POLICY IF EXISTS "Usuários podem deletar produtos dos orçamentos" ON public.orcamento_produtos;
CREATE POLICY "Usuários podem deletar produtos dos orçamentos" 
ON public.orcamento_produtos 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_produtos.orcamento_id
      AND o.atendente_id = auth.uid()
    )
  )
);

-- Permitir exclusão de orçamentos pelos administradores ou proprietários
DROP POLICY IF EXISTS "Admins e proprietários podem deletar orçamentos" ON public.orcamentos;
CREATE POLICY "Admins e proprietários podem deletar orçamentos" 
ON public.orcamentos 
FOR DELETE 
USING (is_admin() OR atendente_id = auth.uid());