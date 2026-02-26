CREATE POLICY "Authenticated users can delete contas_receber"
  ON public.contas_receber
  FOR DELETE
  USING (auth.uid() IS NOT NULL);