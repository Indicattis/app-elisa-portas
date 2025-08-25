-- Adicionar campos para armazenar informações das ordens no pedido
ALTER TABLE public.pedidos_producao
ADD COLUMN ordens_separacao jsonb DEFAULT '[]'::jsonb,
ADD COLUMN ordens_perfiladeira jsonb DEFAULT '[]'::jsonb,
ADD COLUMN ordens_soldagem jsonb DEFAULT '[]'::jsonb,
ADD COLUMN ordens_pintura jsonb DEFAULT '[]'::jsonb,
ADD COLUMN status_ordens jsonb DEFAULT '{
  "separacao": "pendente",
  "perfiladeira": "pendente", 
  "soldagem": "pendente",
  "pintura": "pendente"
}'::jsonb;