-- Update constraint to allow pintura_epoxi product type
ALTER TABLE orcamento_produtos 
DROP CONSTRAINT orcamento_produtos_tipo_produto_check;

ALTER TABLE orcamento_produtos 
ADD CONSTRAINT orcamento_produtos_tipo_produto_check 
CHECK (tipo_produto = ANY (ARRAY['porta_enrolar'::text, 'porta_social'::text, 'acessorio'::text, 'manutencao'::text, 'adicional'::text, 'pintura_epoxi'::text]));