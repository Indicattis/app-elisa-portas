-- Adicionar políticas RLS para garantir que apenas o responsável pode marcar linhas

-- Policy para ordens_soldagem: apenas responsável pode atualizar
DROP POLICY IF EXISTS "Authenticated users can update ordens_soldagem" ON public.ordens_soldagem;
CREATE POLICY "Only assigned user can update soldagem order"
  ON public.ordens_soldagem
  FOR UPDATE
  TO authenticated
  USING (responsavel_id IS NULL OR responsavel_id = auth.uid());

-- Policy para ordens_perfiladeira: apenas responsável pode atualizar
DROP POLICY IF EXISTS "Authenticated users can update ordens_perfiladeira" ON public.ordens_perfiladeira;
CREATE POLICY "Only assigned user can update perfiladeira order"
  ON public.ordens_perfiladeira
  FOR UPDATE
  TO authenticated
  USING (responsavel_id IS NULL OR responsavel_id = auth.uid());

-- Policy para ordens_separacao: apenas responsável pode atualizar
DROP POLICY IF EXISTS "Authenticated users can update ordens_separacao" ON public.ordens_separacao;
CREATE POLICY "Only assigned user can update separacao order"
  ON public.ordens_separacao
  FOR UPDATE
  TO authenticated
  USING (responsavel_id IS NULL OR responsavel_id = auth.uid());

-- Policy para ordens_qualidade: apenas responsável pode atualizar
DROP POLICY IF EXISTS "Authenticated users can update ordens_qualidade" ON public.ordens_qualidade;
CREATE POLICY "Only assigned user can update qualidade order"
  ON public.ordens_qualidade
  FOR UPDATE
  TO authenticated
  USING (responsavel_id IS NULL OR responsavel_id = auth.uid());

-- Função para verificar se usuário pode marcar linhas
CREATE OR REPLACE FUNCTION public.pode_marcar_linhas_ordem(
  p_ordem_id uuid,
  p_tipo_ordem text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_responsavel_id uuid;
BEGIN
  -- Buscar responsável baseado no tipo de ordem
  CASE p_tipo_ordem
    WHEN 'soldagem' THEN
      SELECT responsavel_id INTO v_responsavel_id
      FROM ordens_soldagem
      WHERE id = p_ordem_id;
    WHEN 'perfiladeira' THEN
      SELECT responsavel_id INTO v_responsavel_id
      FROM ordens_perfiladeira
      WHERE id = p_ordem_id;
    WHEN 'separacao' THEN
      SELECT responsavel_id INTO v_responsavel_id
      FROM ordens_separacao
      WHERE id = p_ordem_id;
    WHEN 'qualidade' THEN
      SELECT responsavel_id INTO v_responsavel_id
      FROM ordens_qualidade
      WHERE id = p_ordem_id;
    ELSE
      RETURN false;
  END CASE;
  
  -- Se não tem responsável ou é o responsável, pode marcar
  RETURN v_responsavel_id IS NULL OR v_responsavel_id = auth.uid();
END;
$$;

-- Policy para linhas_ordens: apenas responsável pode atualizar
DROP POLICY IF EXISTS "Authenticated users can manage linhas_ordens" ON public.linhas_ordens;

CREATE POLICY "Anyone can view linhas_ordens"
  ON public.linhas_ordens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert linhas_ordens"
  ON public.linhas_ordens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only assigned user can update linhas"
  ON public.linhas_ordens
  FOR UPDATE
  TO authenticated
  USING (pode_marcar_linhas_ordem(ordem_id, tipo_ordem));

CREATE POLICY "Admins can delete linhas_ordens"
  ON public.linhas_ordens
  FOR DELETE
  TO authenticated
  USING (is_admin());