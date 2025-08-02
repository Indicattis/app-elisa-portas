-- Adicionar política para permitir que usuários atualizem sua própria foto de perfil
CREATE POLICY "Usuários podem atualizar sua própria foto de perfil" 
ON admin_users 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());