-- Create table for daily sales counter
CREATE TABLE IF NOT EXISTS public.contador_vendas_dias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  valor numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contador_vendas_dias ENABLE ROW LEVEL SECURITY;

-- Validation function: disallow inserts/updates for past dates
CREATE OR REPLACE FUNCTION public.validate_contador_vendas_dias()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.data < current_date THEN
      RAISE EXCEPTION 'Não é possível criar/alterar valores de dias passados';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER set_contador_vendas_updated_at
BEFORE UPDATE ON public.contador_vendas_dias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to enforce date validation
CREATE TRIGGER validate_contador_vendas_past_days
BEFORE INSERT OR UPDATE ON public.contador_vendas_dias
FOR EACH ROW
EXECUTE FUNCTION public.validate_contador_vendas_dias();

-- Policies
-- Allow authenticated active users to view records
CREATE POLICY "Usuários autenticados podem ver contador de vendas"
ON public.contador_vendas_dias
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.ativo = true
  )
);

-- Allow authenticated active users to insert their own records (future/today only enforced by trigger)
CREATE POLICY "Usuários autenticados podem criar contador de vendas"
ON public.contador_vendas_dias
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL)
  AND EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.ativo = true
  )
  AND created_by = auth.uid()
);

-- Allow owners or admins to update (future/today only enforced by trigger)
CREATE POLICY "Criadores ou admins podem atualizar contador de vendas"
ON public.contador_vendas_dias
FOR UPDATE
USING (
  created_by = auth.uid() OR is_admin()
)
WITH CHECK (
  created_by = auth.uid() OR is_admin()
);
