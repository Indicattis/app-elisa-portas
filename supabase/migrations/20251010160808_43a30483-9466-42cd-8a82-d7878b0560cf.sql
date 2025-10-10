-- Adicionar campos de tamanho e checkboxes às linhas de pedido
ALTER TABLE pedido_linhas
ADD COLUMN IF NOT EXISTS tamanho text,
ADD COLUMN IF NOT EXISTS check_separacao boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_qualidade boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_coleta boolean DEFAULT false;