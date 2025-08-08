-- Add policy to allow admins to update any row in admin_users (e.g., to set foto_perfil_url)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_users' 
      AND policyname = 'Admins podem atualizar admin_users'
  ) THEN
    CREATE POLICY "Admins podem atualizar admin_users"
    ON public.admin_users
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;