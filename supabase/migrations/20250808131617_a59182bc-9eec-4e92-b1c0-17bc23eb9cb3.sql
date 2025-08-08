-- Ensure RLS is enabled and proper policies exist for updating profile photos on admin_users

-- Enable Row Level Security on admin_users (safe if already enabled)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to update any user row (including foto_perfil_url)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_users' 
      AND polname = 'Admins can update any admin_users row'
  ) THEN
    CREATE POLICY "Admins can update any admin_users row"
    ON public.admin_users
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Allow users to update their own row (e.g., their own foto_perfil_url)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_users' 
      AND polname = 'Users can update their own admin_users row'
  ) THEN
    CREATE POLICY "Users can update their own admin_users row"
    ON public.admin_users
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Optional: allow authenticated users to select admin_users (needed by several pages)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_users' 
      AND polname = 'Authenticated users can select admin_users'
  ) THEN
    CREATE POLICY "Authenticated users can select admin_users"
    ON public.admin_users
    FOR SELECT
    USING (true);
  END IF;
END $$;