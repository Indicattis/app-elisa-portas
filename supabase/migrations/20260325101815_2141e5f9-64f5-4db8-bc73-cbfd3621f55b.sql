DROP POLICY IF EXISTS "Authenticated users can insert missao_checkboxes" ON public.missao_checkboxes;

CREATE POLICY "Creator or admin can insert missao_checkboxes"
ON public.missao_checkboxes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM missoes
    WHERE missoes.id = missao_checkboxes.missao_id
      AND missoes.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'diretor')
  OR has_role(auth.uid(), 'administrador')
);