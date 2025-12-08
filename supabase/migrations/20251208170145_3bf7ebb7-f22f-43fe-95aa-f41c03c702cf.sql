-- Adicionar campos para agendamento de postagens
ALTER TABLE public.postagens 
ADD COLUMN IF NOT EXISTS agendada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS postada BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hora_agendamento TIME DEFAULT NULL;

-- Atualizar postagens existentes: se data_postagem <= hoje, está postada
UPDATE public.postagens 
SET postada = true, agendada = false
WHERE data_postagem <= CURRENT_DATE;

-- Criar índice para buscar postagens agendadas pendentes
CREATE INDEX IF NOT EXISTS idx_postagens_agendadas 
ON public.postagens (data_postagem, agendada, postada) 
WHERE agendada = true AND postada = false;

-- Função para marcar postagens agendadas como postadas quando a data chegar
CREATE OR REPLACE FUNCTION public.processar_postagens_agendadas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  postagens_atualizadas INTEGER;
BEGIN
  UPDATE public.postagens
  SET postada = true,
      updated_at = NOW()
  WHERE agendada = true
    AND postada = false
    AND data_postagem <= CURRENT_DATE
    AND (hora_agendamento IS NULL OR hora_agendamento <= CURRENT_TIME);
  
  GET DIAGNOSTICS postagens_atualizadas = ROW_COUNT;
  
  RETURN postagens_atualizadas;
END;
$$;