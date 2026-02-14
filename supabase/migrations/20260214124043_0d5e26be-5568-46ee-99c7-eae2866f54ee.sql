
CREATE POLICY "Usuarios autenticados podem deletar itens"
ON public.estoque_conferencia_itens
FOR DELETE
USING (true);

CREATE POLICY "Usuarios autenticados podem deletar conferencias"
ON public.estoque_conferencias
FOR DELETE
USING (true);
