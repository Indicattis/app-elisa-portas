-- Corrigir função para incluir SET search_path 
CREATE OR REPLACE FUNCTION gerar_proximo_numero(tipo_documento text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  proximo_num integer;
BEGIN
  UPDATE numeracao_controle 
  SET proximo_numero = proximo_numero + 1,
      updated_at = now()
  WHERE tipo = tipo_documento
  RETURNING proximo_numero - 1 INTO proximo_num;
  
  RETURN proximo_num;
END;
$$;