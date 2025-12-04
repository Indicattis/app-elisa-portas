-- Remover política de exclusão existente
DROP POLICY IF EXISTS "Usuários autenticados podem excluir comprovantes" ON storage.objects;

-- Criar política de exclusão apenas para administradores
CREATE POLICY "Apenas administradores podem excluir comprovantes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'comprovantes-pagamento' 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND ativo = true
  )
);