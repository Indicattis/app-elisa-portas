CREATE POLICY "Gestores podem visualizar todos os roles"
ON public.system_roles FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM admin_users
  WHERE admin_users.user_id = auth.uid()
    AND admin_users.role IN (
      'administrador','diretor','gerente_marketing','gerente_comercial',
      'gerente_producao','gerente_fabril','gerente_instalacoes','gerente_financeiro'
    )
    AND admin_users.ativo = true
));