-- Adicionar política RLS para gerentes financeiros excluírem vendas
CREATE POLICY "Gerentes financeiros podem deletar vendas"
ON public.vendas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'gerente_financeiro'
    AND ativo = true
  )
);