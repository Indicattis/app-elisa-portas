-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create instalacoes_cadastradas" ON public.instalacoes_cadastradas;

-- Create a simpler INSERT policy that allows any authenticated user to create installations
CREATE POLICY "Any authenticated user can create instalacoes_cadastradas"
ON public.instalacoes_cadastradas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);