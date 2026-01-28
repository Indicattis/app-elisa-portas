-- Corrigir política de UPDATE para aceitar 'admin' ou 'administrador'
DROP POLICY IF EXISTS "Administradores podem atualizar configurações" ON public.configuracoes_vendas;

CREATE POLICY "Administradores podem atualizar configurações" 
ON public.configuracoes_vendas 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND (admin_users.role = 'admin' OR admin_users.role = 'administrador' OR admin_users.bypass_permissions = true)
    AND admin_users.ativo = true
  )
);

-- Corrigir também a política de INSERT
DROP POLICY IF EXISTS "Administradores podem inserir configurações" ON public.configuracoes_vendas;

CREATE POLICY "Administradores podem inserir configurações" 
ON public.configuracoes_vendas 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND (admin_users.role = 'admin' OR admin_users.role = 'administrador' OR admin_users.bypass_permissions = true)
    AND admin_users.ativo = true
  )
);