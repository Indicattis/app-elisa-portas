-- Corrigir políticas RLS para orçamentos - permitir atendentes ver todos, mas editar apenas os próprios

-- 1. Corrigir política de visualização para permitir ver todos os orçamentos
DROP POLICY IF EXISTS "Usuários podem ver orçamentos dos leads que têm acesso" ON public.orcamentos;

CREATE POLICY "Atendentes podem ver todos os orçamentos" 
ON public.orcamentos 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('atendente', 'gerente_comercial', 'gerente_fabril')
  )
);

-- 2. Corrigir política de inserção
DROP POLICY IF EXISTS "Usuários autenticados podem criar orçamentos" ON public.orcamentos;

CREATE POLICY "Atendentes podem criar orçamentos" 
ON public.orcamentos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND atendente_id = auth.uid()
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

-- 3. Corrigir política de edição - apenas próprios orçamentos ou admins/gerentes
DROP POLICY IF EXISTS "Usuários podem editar próprios orçamentos" ON public.orcamentos;

CREATE POLICY "Usuários podem editar próprios orçamentos" 
ON public.orcamentos 
FOR UPDATE 
USING (
  is_admin() OR 
  (atendente_id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true 
    AND role IN ('gerente_comercial', 'gerente_fabril')
  )
);