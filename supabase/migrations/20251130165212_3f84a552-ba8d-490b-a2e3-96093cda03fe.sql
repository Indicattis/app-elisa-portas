-- Add 'retrocesso' to the allowed values in pedidos_movimentacoes teor check constraint
ALTER TABLE public.pedidos_movimentacoes 
DROP CONSTRAINT IF EXISTS pedidos_movimentacoes_teor_check;

ALTER TABLE public.pedidos_movimentacoes 
ADD CONSTRAINT pedidos_movimentacoes_teor_check 
CHECK (teor IN ('avanco', 'backlog', 'reorganizacao', 'criacao', 'retrocesso'));