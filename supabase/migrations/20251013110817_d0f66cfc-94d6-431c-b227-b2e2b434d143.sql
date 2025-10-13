-- Criar política para permitir gerentes atualizarem todas as vendas
CREATE POLICY "Gerentes podem atualizar todas as vendas"
ON public.vendas
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.ativo = true
      AND admin_users.role IN ('gerente_financeiro', 'gerente_comercial', 'administrador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.ativo = true
      AND admin_users.role IN ('gerente_financeiro', 'gerente_comercial', 'administrador')
  )
);