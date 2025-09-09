-- Remove the restrictive policy and create more permissive ones for pontos_instalacao
DROP POLICY IF EXISTS "Gerentes fabris e admins podem gerenciar pontos de instalação" ON public.pontos_instalacao;

-- Create new policies that allow authenticated users to manage installation points
CREATE POLICY "Authenticated users can create pontos_instalacao" 
ON public.pontos_instalacao 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Authenticated users can update pontos_instalacao" 
ON public.pontos_instalacao 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pontos_instalacao" 
ON public.pontos_instalacao 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);