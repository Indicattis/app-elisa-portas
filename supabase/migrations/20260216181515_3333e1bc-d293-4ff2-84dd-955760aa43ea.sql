
-- Adicionar coluna para armazenar tempo de permanência em segundos úteis
ALTER TABLE pedidos_etapas 
ADD COLUMN tempo_permanencia_segundos numeric;

-- Função auxiliar para calcular segundos úteis entre duas datas (7h-17h, seg-sex, fuso Brasília)
CREATE OR REPLACE FUNCTION calcular_segundos_uteis(p_inicio timestamptz, p_fim timestamptz)
RETURNS numeric AS $$
DECLARE
  v_inicio timestamptz;
  v_fim timestamptz;
  v_dia date;
  v_dia_fim date;
  v_dia_semana int;
  v_inicio_exp timestamptz;
  v_fim_exp timestamptz;
  v_inicio_efetivo timestamptz;
  v_fim_efetivo timestamptz;
  v_total numeric := 0;
BEGIN
  IF p_inicio IS NULL OR p_fim IS NULL OR p_inicio >= p_fim THEN
    RETURN 0;
  END IF;

  -- Converter para horário de Brasília
  v_inicio := p_inicio AT TIME ZONE 'America/Sao_Paulo';
  v_fim := p_fim AT TIME ZONE 'America/Sao_Paulo';
  
  v_dia := v_inicio::date;
  v_dia_fim := v_fim::date;

  WHILE v_dia <= v_dia_fim LOOP
    v_dia_semana := EXTRACT(DOW FROM v_dia);
    
    -- Pular sábado (6) e domingo (0)
    IF v_dia_semana NOT IN (0, 6) THEN
      v_inicio_exp := (v_dia || ' 07:00:00')::timestamp;
      v_fim_exp := (v_dia || ' 17:00:00')::timestamp;
      
      v_inicio_efetivo := GREATEST(v_inicio_exp, v_inicio::timestamp);
      v_fim_efetivo := LEAST(v_fim_exp, v_fim::timestamp);
      
      IF v_inicio_efetivo < v_fim_efetivo THEN
        v_total := v_total + EXTRACT(EPOCH FROM (v_fim_efetivo - v_inicio_efetivo));
      END IF;
    END IF;
    
    v_dia := v_dia + 1;
  END LOOP;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Preencher retroativamente registros que já têm data_entrada e data_saida
UPDATE pedidos_etapas
SET tempo_permanencia_segundos = calcular_segundos_uteis(data_entrada, data_saida)
WHERE data_entrada IS NOT NULL 
  AND data_saida IS NOT NULL 
  AND tempo_permanencia_segundos IS NULL;
