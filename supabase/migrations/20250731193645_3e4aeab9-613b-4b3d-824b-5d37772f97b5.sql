-- Add foreign key relationship between eventos_membros and admin_users
ALTER TABLE public.eventos_membros 
ADD CONSTRAINT fk_eventos_membros_user_id 
FOREIGN KEY (user_id) REFERENCES public.admin_users(user_id) ON DELETE CASCADE;