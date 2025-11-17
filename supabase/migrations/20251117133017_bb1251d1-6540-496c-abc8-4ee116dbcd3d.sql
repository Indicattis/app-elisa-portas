
-- Remover o constraint antigo
ALTER TABLE produtos_vendas DROP CONSTRAINT IF EXISTS check_tipo_produto;

-- Adicionar novo constraint incluindo 'manutencao'
ALTER TABLE produtos_vendas ADD CONSTRAINT check_tipo_produto 
CHECK (tipo_produto = ANY (ARRAY['porta_enrolar'::text, 'porta_social'::text, 'pintura_epoxi'::text, 'acessorio'::text, 'adicional'::text, 'porta'::text, 'manutencao'::text]));
