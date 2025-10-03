-- Ajustar políticas RLS para permitir que atendentes atualizem instalações
-- Remover a política atual de UPDATE que só permite admins
DROP POLICY IF EXISTS "Apenas admins podem atualizar instalações (exceto status)" ON public.instalacoes_cadastradas;

-- Criar nova política de UPDATE que permite atendentes autenticados atualizarem campos específicos
CREATE POLICY "Atendentes podem atualizar instalações"
ON public.instalacoes_cadastradas
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.ativo = true
  )
);

-- Comentário explicativo
COMMENT ON POLICY "Atendentes podem atualizar instalações" ON public.instalacoes_cadastradas 
IS 'Permite que qualquer atendente ativo atualize instalações, necessário para vincular vendas às instalações';