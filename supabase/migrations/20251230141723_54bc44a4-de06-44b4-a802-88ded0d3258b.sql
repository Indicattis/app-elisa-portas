-- Política para admins atualizarem ordens de soldagem
CREATE POLICY "Admins can update ordens_soldagem"
ON public.ordens_soldagem
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Política para admins atualizarem ordens de perfiladeira
CREATE POLICY "Admins can update ordens_perfiladeira"
ON public.ordens_perfiladeira
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Política para admins atualizarem ordens de separacao
CREATE POLICY "Admins can update ordens_separacao"
ON public.ordens_separacao
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Política para admins atualizarem ordens de pintura
CREATE POLICY "Admins can update ordens_pintura"
ON public.ordens_pintura
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Política para admins atualizarem ordens de qualidade
CREATE POLICY "Admins can update ordens_qualidade"
ON public.ordens_qualidade
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Política para admins atualizarem ordens de carregamento
CREATE POLICY "Admins can update ordens_carregamento"
ON public.ordens_carregamento
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());