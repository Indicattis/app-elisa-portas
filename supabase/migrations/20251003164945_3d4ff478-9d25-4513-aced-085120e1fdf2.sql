-- Adicionar policy para permitir que atendentes editem suas próprias vendas
CREATE POLICY "Atendentes podem atualizar suas vendas"
ON public.vendas
FOR UPDATE
TO public
USING (
  -- Verifica se o usuário é o atendente da venda
  atendente_id = auth.uid()
  -- E se é um usuário ativo no sistema
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true
  )
);