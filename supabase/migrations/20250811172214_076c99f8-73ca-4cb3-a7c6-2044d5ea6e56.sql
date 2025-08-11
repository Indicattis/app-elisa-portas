-- Restrict public access to autorizados: require authentication for reads
-- 1) Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.autorizados ENABLE ROW LEVEL SECURITY;

-- 2) Drop the existing public SELECT policy if it exists
DROP POLICY IF EXISTS "Autorizados ativos são visíveis publicamente" ON public.autorizados;

-- 3) Keep existing admin ALL policy as-is (no change)
-- Policy "Admins podem gerenciar autorizados" already exists and grants admins full access via is_admin()

-- 4) Create a new authenticated-only SELECT policy for active records
CREATE POLICY "Usuários autenticados podem ver autorizados ativos"
ON public.autorizados
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (ativo = true));