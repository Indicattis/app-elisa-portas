-- First, add unique constraint to admin_users.user_id
ALTER TABLE public.admin_users 
ADD CONSTRAINT unique_admin_users_user_id UNIQUE (user_id);

-- Then add foreign key relationship between eventos_membros and admin_users
ALTER TABLE public.eventos_membros 
ADD CONSTRAINT fk_eventos_membros_user_id 
FOREIGN KEY (user_id) REFERENCES public.admin_users(user_id) ON DELETE CASCADE;