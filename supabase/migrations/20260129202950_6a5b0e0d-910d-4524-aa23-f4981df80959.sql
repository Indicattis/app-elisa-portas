-- Atualizar registros existentes para unidade legível
UPDATE vendas_catalogo 
SET unidade = 'Unitário' 
WHERE unidade = 'UN' OR unidade IS NULL;