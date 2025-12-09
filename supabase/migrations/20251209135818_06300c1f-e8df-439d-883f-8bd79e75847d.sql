-- Permitir que administradores excluam chamados de suporte
CREATE POLICY "Only admins can delete chamados_suporte"
ON public.chamados_suporte
FOR DELETE
USING (is_admin());