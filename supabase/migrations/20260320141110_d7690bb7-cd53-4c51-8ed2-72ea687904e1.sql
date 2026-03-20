ALTER TABLE public.missoes ADD COLUMN responsavel_id uuid REFERENCES admin_users(user_id);
ALTER TABLE public.missao_checkboxes ADD COLUMN prazo date;
ALTER TABLE public.missoes DROP COLUMN prazo;