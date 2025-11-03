-- Atualizar função para incluir verificação de ordens de pintura
CREATE OR REPLACE FUNCTION public.pode_marcar_linhas_ordem(p_ordem_id uuid, p_tipo_ordem text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    WHEN 'pintura' THEN
      SELECT responsavel_id INTO v_responsavel_id
      FROM ordens_pintura
      WHERE id = p_ordem_id;
    ELSE
      RETURN false;
  END CASE;
  
  -- Se não tem responsável ou é o responsável, pode marcar
  RETURN v_responsavel_id IS NULL OR v_responsavel_id = auth.uid();
END;
$function$;