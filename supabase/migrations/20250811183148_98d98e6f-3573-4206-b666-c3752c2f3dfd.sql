-- Secure function by setting search_path explicitly
CREATE OR REPLACE FUNCTION public.validate_contador_vendas_dias()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.data < current_date THEN
      RAISE EXCEPTION 'Não é possível criar/alterar valores de dias passados';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;