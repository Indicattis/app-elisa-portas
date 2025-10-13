-- Adicionar política para permitir gerente_comercial deletar vendas
CREATE POLICY "Gerentes comerciais podem deletar vendas" 
ON public.vendas 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE admin_users.user_id = auth.uid() 
      AND admin_users.ativo = true 
      AND admin_users.role = 'gerente_comercial'
  )
);