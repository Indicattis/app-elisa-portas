-- Adicionar políticas RLS faltantes para ordens_soldagem e ordens_separacao
-- permitindo que usuários autenticados visualizem e criem ordens

-- Ordens de Soldagem
CREATE POLICY "Authenticated users can view ordens_soldagem"
ON public.ordens_soldagem
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create ordens_soldagem"
ON public.ordens_soldagem
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

-- Ordens de Separação
CREATE POLICY "Authenticated users can view ordens_separacao"
ON public.ordens_separacao
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create ordens_separacao"
ON public.ordens_separacao
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);