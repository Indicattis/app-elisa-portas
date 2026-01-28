-- Adicionar coluna linha_problema_id nas tabelas de ordens de produção
ALTER TABLE ordens_soldagem 
ADD COLUMN linha_problema_id UUID REFERENCES linhas_ordens(id) ON DELETE SET NULL;

ALTER TABLE ordens_perfiladeira 
ADD COLUMN linha_problema_id UUID REFERENCES linhas_ordens(id) ON DELETE SET NULL;

ALTER TABLE ordens_separacao 
ADD COLUMN linha_problema_id UUID REFERENCES linhas_ordens(id) ON DELETE SET NULL;