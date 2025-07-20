-- Adicionar campos de endereço aos pedidos de produção
ALTER TABLE public.pedidos_producao
ADD COLUMN endereco_rua text,
ADD COLUMN endereco_numero text,
ADD COLUMN endereco_bairro text,
ADD COLUMN endereco_cidade text,
ADD COLUMN endereco_estado text,
ADD COLUMN endereco_cep text;