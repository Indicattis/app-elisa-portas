ALTER TABLE public.acordos_instalacao_autorizados
  ADD COLUMN aprovado_direcao boolean NOT NULL DEFAULT false,
  ADD COLUMN aprovado_direcao_por uuid REFERENCES auth.users(id),
  ADD COLUMN aprovado_direcao_em timestamptz;