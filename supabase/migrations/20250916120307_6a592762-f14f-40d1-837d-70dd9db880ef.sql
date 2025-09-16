-- Corrigir a função adicionando search_path para resolver warning de segurança
CREATE OR REPLACE FUNCTION public.resetar_contagem_inativacao()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Resetar a data de início da contagem quando uma nova avaliação for criada
  UPDATE public.autorizados 
  SET data_inicio_contagem_inativacao = now()
  WHERE id = NEW.autorizado_id;
  
  RETURN NEW;
END;
$$;