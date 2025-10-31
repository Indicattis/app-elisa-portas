-- Remover constraint antiga que não permite 'qualidade'
ALTER TABLE linhas_ordens 
DROP CONSTRAINT IF EXISTS linhas_ordens_tipo_ordem_check;

-- Adicionar constraint nova que inclui 'qualidade', 'instalacao' e 'pintura'
ALTER TABLE linhas_ordens
ADD CONSTRAINT linhas_ordens_tipo_ordem_check 
CHECK (tipo_ordem IN ('soldagem', 'perfiladeira', 'separacao', 'qualidade', 'pintura', 'instalacao'));