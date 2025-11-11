-- Criar políticas RLS para permitir administradores gerenciarem user_route_access

-- Política para INSERT: apenas admins podem adicionar acessos
CREATE POLICY "Admins can insert user_route_access" 
ON user_route_access 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'administrador'));

-- Política para UPDATE: apenas admins podem atualizar acessos
CREATE POLICY "Admins can update user_route_access" 
ON user_route_access 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'administrador'))
WITH CHECK (has_role(auth.uid(), 'administrador'));

-- Política para DELETE: apenas admins podem remover acessos
CREATE POLICY "Admins can delete user_route_access" 
ON user_route_access 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'administrador'));

-- Política para SELECT: admins podem ver todos os acessos
CREATE POLICY "Admins can view all user_route_access" 
ON user_route_access 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'administrador'));