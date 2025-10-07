-- Adicionar coluna tipo_pintura para suportar diferentes tipos de pintura
ALTER TABLE portas_vendas
ADD COLUMN IF NOT EXISTS tipo_pintura TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN portas_vendas.tipo_pintura IS 'Tipo específico de pintura quando tipo_produto = pintura_epoxi (ex: Epóxi, Eletrostática)';