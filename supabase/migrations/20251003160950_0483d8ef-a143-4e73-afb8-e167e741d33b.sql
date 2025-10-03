-- Drop the restrictive policy that only allows admins to insert
DROP POLICY IF EXISTS "Only admins can insert instalacoes" ON public.instalacoes_cadastradas;

-- Create new policy allowing authenticated active users to insert instalacoes
-- This allows the trigger to work when attendants create sales
CREATE POLICY "Authenticated users can insert instalacoes"
ON public.instalacoes_cadastradas
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be an active admin user (attendant, manager, or admin)
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND ativo = true
  )
);