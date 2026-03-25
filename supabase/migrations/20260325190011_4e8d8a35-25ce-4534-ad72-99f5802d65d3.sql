CREATE POLICY "Anon can read active clientes"
ON public.clientes
FOR SELECT
TO anon
USING (ativo = true);