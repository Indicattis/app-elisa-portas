-- Remover a constraint de unicidade do CNPJ para permitir 
-- cadastrar a mesma empresa em diferentes ambientes (produção/homologação)
ALTER TABLE public.empresas_emissoras 
DROP CONSTRAINT IF EXISTS empresas_emissoras_cnpj_key;