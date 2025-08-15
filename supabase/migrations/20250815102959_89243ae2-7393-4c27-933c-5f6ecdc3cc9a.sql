-- Corrigir política de inserção de orçamentos para permitir usuários atendentes
DROP POLICY IF EXISTS "Usuários autenticados podem criar orçamentos" ON public.orcamentos;

CREATE POLICY "Usuários autenticados podem criar orçamentos" 
ON public.orcamentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND atendente_id = auth.uid()
  AND (
    is_admin() 
    OR EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND ativo = true 
      AND role IN ('atendente', 'gerente_comercial', 'gerente_fabril')
    )
  )
);