-- First, clean up orphaned records in eventos_membros
DELETE FROM public.eventos_membros 
WHERE user_id NOT IN (SELECT user_id FROM public.admin_users);

-- Add unique constraint to admin_users.user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_admin_users_user_id'
    ) THEN
        ALTER TABLE public.admin_users 
        ADD CONSTRAINT unique_admin_users_user_id UNIQUE (user_id);
    END IF;
END $$;

-- Add foreign key relationship between eventos_membros and admin_users
ALTER TABLE public.eventos_membros 
ADD CONSTRAINT fk_eventos_membros_user_id 
FOREIGN KEY (user_id) REFERENCES public.admin_users(user_id) ON DELETE CASCADE;