
-- Table to log km changes
CREATE TABLE public.veiculos_km_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid REFERENCES public.veiculos(id) ON DELETE CASCADE NOT NULL,
  km_anterior numeric NOT NULL,
  km_novo numeric NOT NULL,
  origem text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.veiculos_km_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view km history"
  ON public.veiculos_km_historico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert km history"
  ON public.veiculos_km_historico FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_veiculos_km_historico_veiculo_id ON public.veiculos_km_historico(veiculo_id);

-- Trigger to auto-log km changes
CREATE OR REPLACE FUNCTION public.log_km_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.km_atual IS DISTINCT FROM NEW.km_atual THEN
    INSERT INTO public.veiculos_km_historico (veiculo_id, km_anterior, km_novo, created_by)
    VALUES (NEW.id, COALESCE(OLD.km_atual, 0), NEW.km_atual, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_km_change
  AFTER UPDATE ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.log_km_change();
