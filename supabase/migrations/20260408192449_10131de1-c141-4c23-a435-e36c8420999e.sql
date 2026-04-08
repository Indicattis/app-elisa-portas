CREATE POLICY "Admins can update linhas_ordens"
ON public.linhas_ordens
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());