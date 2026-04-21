DROP POLICY IF EXISTS "Administradores podem atualizar configurações" ON public.configuracoes_vendas;
DROP POLICY IF EXISTS "Administradores podem inserir configurações" ON public.configuracoes_vendas;

CREATE POLICY "Admins e diretores podem atualizar configurações"
ON public.configuracoes_vendas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND ativo = true
      AND (role IN ('admin','administrador','diretor') OR bypass_permissions = true)
  )
);

CREATE POLICY "Admins e diretores podem inserir configurações"
ON public.configuracoes_vendas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND ativo = true
      AND (role IN ('admin','administrador','diretor') OR bypass_permissions = true)
  )
);