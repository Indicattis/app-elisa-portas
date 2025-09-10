-- Add foreign key constraint between autorizados_ratings and admin_users
ALTER TABLE public.autorizados_ratings
ADD CONSTRAINT fk_autorizados_ratings_atendente_id 
FOREIGN KEY (atendente_id) REFERENCES public.admin_users(id);