-- Corrigir função map_etapa_to_instalacao_status para usar status válidos
CREATE OR REPLACE FUNCTION public.map_etapa_to_instalacao_status(etapa TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Status válidos para instalacoes: 'pendente_producao', 'pronta_fabrica', 'finalizada'
  RETURN CASE etapa
    WHEN 'aberto' THEN 'pendente_producao'
    WHEN 'em_producao' THEN 'pendente_producao'
    WHEN 'inspecao_qualidade' THEN 'pendente_producao'
    WHEN 'aguardando_pintura' THEN 'pendente_producao'
    WHEN 'aguardando_instalacao' THEN 'pronta_fabrica'
    WHEN 'aguardando_coleta' THEN 'pronta_fabrica'
    WHEN 'finalizado' THEN 'finalizada'
    ELSE 'pendente_producao'
  END;
END;
$$;