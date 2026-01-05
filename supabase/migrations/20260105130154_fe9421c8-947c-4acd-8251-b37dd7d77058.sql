-- Atualizar a função gerar_numero_ordem para incluir o tipo terceirizacao
CREATE OR REPLACE FUNCTION gerar_numero_ordem(tipo_ordem text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefixo text;
  tabela_nome text;
  ano text;
  proximo_numero integer;
  numero_formatado text;
BEGIN
  ano := to_char(now(), 'YYYY');
  
  -- Mapear tipo para prefixo e tabela
  CASE tipo_ordem
    WHEN 'soldagem' THEN 
      prefixo := 'OSL';
      tabela_nome := 'ordens_soldagem';
    WHEN 'perfiladeira' THEN 
      prefixo := 'OPE';
      tabela_nome := 'ordens_perfiladeira';
    WHEN 'separacao' THEN 
      prefixo := 'OSE';
      tabela_nome := 'ordens_separacao';
    WHEN 'qualidade' THEN 
      prefixo := 'OQU';
      tabela_nome := 'ordens_qualidade';
    WHEN 'pintura' THEN 
      prefixo := 'OPI';
      tabela_nome := 'ordens_pintura';
    WHEN 'carregamento' THEN 
      prefixo := 'OCA';
      tabela_nome := 'ordens_carregamento';
    WHEN 'porta_social' THEN 
      prefixo := 'OPS';
      tabela_nome := 'ordens_porta_social';
    WHEN 'terceirizacao' THEN 
      prefixo := 'OTE';
      tabela_nome := 'ordens_terceirizacao';
    ELSE
      RAISE EXCEPTION 'Tipo de ordem desconhecido: %', tipo_ordem;
  END CASE;
  
  -- Buscar próximo número para o ano atual
  EXECUTE format(
    'SELECT COALESCE(MAX(
      CASE 
        WHEN numero_ordem ~ ''^%s-%s-[0-9]+$'' 
        THEN CAST(split_part(numero_ordem, ''-'', 3) AS integer)
        ELSE 0 
      END
    ), 0) + 1 FROM %I',
    prefixo, ano, tabela_nome
  ) INTO proximo_numero;
  
  -- Formatar número com zeros à esquerda
  numero_formatado := lpad(proximo_numero::text, 4, '0');
  
  RETURN prefixo || '-' || ano || '-' || numero_formatado;
END;
$$;