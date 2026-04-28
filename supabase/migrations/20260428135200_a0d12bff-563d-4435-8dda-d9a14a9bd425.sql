ALTER TABLE public.vendas_catalogo
ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_vendas_catalogo_ordem ON public.vendas_catalogo(ordem);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY destaque DESC, nome_produto ASC) AS rn
  FROM public.vendas_catalogo
)
UPDATE public.vendas_catalogo v
SET ordem = ranked.rn
FROM ranked
WHERE v.id = ranked.id;