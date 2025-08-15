-- Corrigir política RLS para orcamento_produtos - permitir ver produtos de todos os orçamentos

-- Atualizar política de visualização de produtos para permitir ver produtos de todos os orçamentos
DROP POLICY IF EXISTS "Usuários podem visualizar produtos dos orçamentos" ON public.orcamento_produtos;

CREATE POLICY "Usuários autenticados podem ver produtos de todos os orçamentos" 
ON public.orcamento_produtos 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND ativo = true 
      AND role IN ('atendente', 'gerente_comercial', 'gerente_fabril')
    )
  )
);