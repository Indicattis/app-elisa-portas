
-- Drop existing restrictive policies for UPDATE, DELETE, and INSERT
DROP POLICY IF EXISTS "Admins e diretores podem atualizar roles" ON public.system_roles;
DROP POLICY IF EXISTS "Admins e diretores podem deletar roles" ON public.system_roles;
DROP POLICY IF EXISTS "Admins e diretores podem inserir roles" ON public.system_roles;
DROP POLICY IF EXISTS "Admins podem criar roles" ON public.system_roles;

-- Recreate with expanded role list
CREATE POLICY "Gestores podem atualizar roles" ON public.system_roles
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('administrador', 'diretor', 'gerente_marketing', 'gerente_comercial', 'gerente_producao', 'gerente_fabril', 'gerente_instalacoes', 'gerente_financeiro')
      AND admin_users.ativo = true
  ));

CREATE POLICY "Gestores podem inserir roles" ON public.system_roles
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('administrador', 'diretor', 'gerente_marketing', 'gerente_comercial', 'gerente_producao', 'gerente_fabril', 'gerente_instalacoes', 'gerente_financeiro')
      AND admin_users.ativo = true
  ));

CREATE POLICY "Gestores podem deletar roles" ON public.system_roles
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('administrador', 'diretor', 'gerente_marketing', 'gerente_comercial', 'gerente_producao', 'gerente_fabril', 'gerente_instalacoes', 'gerente_financeiro')
      AND admin_users.ativo = true
  ));
