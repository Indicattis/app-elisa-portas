
-- Adicionar política RLS para permitir admins atualizarem vendas
CREATE POLICY "Admins podem atualizar vendas" 
  ON public.vendas 
  FOR UPDATE 
  USING (is_admin());
