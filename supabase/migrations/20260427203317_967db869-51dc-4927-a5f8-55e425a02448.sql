CREATE OR REPLACE FUNCTION public.remover_responsavel_ordem_producao(p_ordem_id uuid, p_tipo_ordem text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rows integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sem permissão para remover responsável da ordem'
      USING ERRCODE = '42501';
  END IF;

  CASE p_tipo_ordem
    WHEN 'soldagem' THEN
      UPDATE public.ordens_soldagem
      SET responsavel_id = NULL, capturada_em = NULL, status = 'pendente',
          historico = false, data_conclusao = NULL, pausada = false,
          pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
      WHERE id = p_ordem_id;
    WHEN 'perfiladeira' THEN
      UPDATE public.ordens_perfiladeira
      SET responsavel_id = NULL, capturada_em = NULL, status = 'pendente',
          historico = false, data_conclusao = NULL, pausada = false,
          pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
      WHERE id = p_ordem_id;
    WHEN 'separacao' THEN
      UPDATE public.ordens_separacao
      SET responsavel_id = NULL, capturada_em = NULL, status = 'pendente',
          historico = false, data_conclusao = NULL, pausada = false,
          pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
      WHERE id = p_ordem_id;
    WHEN 'qualidade' THEN
      UPDATE public.ordens_qualidade
      SET responsavel_id = NULL, capturada_em = NULL, status = 'pendente',
          historico = false, data_conclusao = NULL, pausada = false,
          pausada_em = NULL, justificativa_pausa = NULL
      WHERE id = p_ordem_id;
    WHEN 'pintura' THEN
      UPDATE public.ordens_pintura
      SET responsavel_id = NULL, capturada_em = NULL, status = 'pendente',
          historico = false, data_conclusao = NULL
      WHERE id = p_ordem_id;
    WHEN 'embalagem' THEN
      UPDATE public.ordens_embalagem
      SET responsavel_id = NULL, capturada_em = NULL, status = 'pendente',
          historico = false, data_conclusao = NULL, pausada = false,
          pausada_em = NULL, justificativa_pausa = NULL
      WHERE id = p_ordem_id;
    WHEN 'carregamento' THEN
      UPDATE public.ordens_carregamento
      SET responsavel_carregamento_id = NULL, responsavel_carregamento_nome = NULL,
          status = 'pendente'
      WHERE id = p_ordem_id;
    WHEN 'instalacao' THEN
      UPDATE public.instalacoes
      SET responsavel_instalacao_id = NULL, responsavel_instalacao_nome = NULL,
          status = 'pendente'
      WHERE id = p_ordem_id;
    ELSE
      RAISE EXCEPTION 'Tipo de ordem inválido: %', p_tipo_ordem
        USING ERRCODE = '22023';
  END CASE;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Ordem não encontrada para remoção de responsável'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'ordem_id', p_ordem_id,
    'tipo_ordem', p_tipo_ordem
  );
END;
$function$;