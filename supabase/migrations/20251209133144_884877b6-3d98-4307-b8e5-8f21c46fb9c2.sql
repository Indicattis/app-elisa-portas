-- Política de DELETE para ordens_carregamento
CREATE POLICY "Admins can delete ordens_carregamento" 
ON ordens_carregamento FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND ativo = true
  )
);