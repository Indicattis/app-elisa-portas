-- Make lead_id optional in orcamentos table
ALTER TABLE public.orcamentos 
ALTER COLUMN lead_id DROP NOT NULL;