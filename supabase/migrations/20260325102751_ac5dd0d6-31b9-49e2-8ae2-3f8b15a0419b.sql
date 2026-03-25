DROP POLICY IF EXISTS "Creator or admin can delete missao_checkboxes" ON public.missao_checkboxes;

CREATE POLICY "Creator or admin can delete missao_checkboxes"
ON public.missao_checkboxes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM missoes
    WHERE missoes.id = missao_checkboxes.missao_id
      AND missoes.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'diretor'::user_role)
  OR has_role(auth.uid(), 'administrador'::user_role)
);