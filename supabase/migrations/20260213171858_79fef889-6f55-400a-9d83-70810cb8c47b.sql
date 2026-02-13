
-- Add ordem column to estoque table
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;

-- Initialize existing records with sequential values based on nome_produto
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nome_produto) as rn
  FROM public.estoque
)
UPDATE public.estoque e
SET ordem = n.rn
FROM numbered n
WHERE e.id = n.id;
