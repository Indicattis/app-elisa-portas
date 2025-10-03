-- Fix foreign key constraint on instalacoes_cadastradas
-- The created_by field should reference auth.users, not admin_users
-- or be optional since not all auth users may be in admin_users

-- Drop existing foreign key constraint if it exists
ALTER TABLE public.instalacoes_cadastradas 
DROP CONSTRAINT IF EXISTS instalacoes_cadastradas_created_by_fkey;

-- Make created_by nullable and remove the constraint
-- This allows installations to be created by any authenticated user
-- The RLS policies already handle authentication requirements
ALTER TABLE public.instalacoes_cadastradas 
ALTER COLUMN created_by DROP NOT NULL;