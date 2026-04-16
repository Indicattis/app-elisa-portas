ALTER TABLE public.acordos_instalacao_autorizados
  ADD COLUMN pago boolean NOT NULL DEFAULT false,
  ADD COLUMN pago_em timestamptz,
  ADD COLUMN pago_por text;