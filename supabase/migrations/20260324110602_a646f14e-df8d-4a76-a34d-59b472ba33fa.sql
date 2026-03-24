DROP POLICY IF EXISTS "Creator can delete missao_checkboxes" ON public.missao_checkboxes;

CREATE POLICY "Creator or admin can delete missao_checkboxes"
ON public.missao_checkboxes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM missoes
    WHERE missoes.id = missao_checkboxes.missao_id
    AND missoes.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'diretor')
  OR public.has_role(auth.uid(), 'administrador')
);