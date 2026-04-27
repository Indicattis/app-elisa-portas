-- Permitir que qualquer usuário autenticado (admin, gerente, etc.) possa atualizar
-- ordens de produção para remover/atribuir responsável.
-- As policies existentes já cobrem operadores de fábrica e admins; adicionamos
-- uma policy genérica para autenticados nas tabelas que ainda restringiam o UPDATE
-- ao próprio responsável.

CREATE POLICY "Authenticated users can update ordens_separacao"
ON public.ordens_separacao
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ordens_soldagem"
ON public.ordens_soldagem
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ordens_perfiladeira"
ON public.ordens_perfiladeira
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update ordens_qualidade"
ON public.ordens_qualidade
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);