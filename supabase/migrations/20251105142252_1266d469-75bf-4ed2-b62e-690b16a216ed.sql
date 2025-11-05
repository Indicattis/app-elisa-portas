-- Add tempo_conclusao_segundos to all ordem tables
ALTER TABLE ordens_soldagem 
ADD COLUMN tempo_conclusao_segundos integer;

ALTER TABLE ordens_perfiladeira 
ADD COLUMN tempo_conclusao_segundos integer;

ALTER TABLE ordens_separacao 
ADD COLUMN tempo_conclusao_segundos integer;

ALTER TABLE ordens_qualidade 
ADD COLUMN tempo_conclusao_segundos integer;

ALTER TABLE ordens_pintura 
ADD COLUMN tempo_conclusao_segundos integer;

-- Create indexes for better performance
CREATE INDEX idx_ordens_soldagem_tempo_conclusao ON ordens_soldagem(tempo_conclusao_segundos) WHERE tempo_conclusao_segundos IS NOT NULL;
CREATE INDEX idx_ordens_perfiladeira_tempo_conclusao ON ordens_perfiladeira(tempo_conclusao_segundos) WHERE tempo_conclusao_segundos IS NOT NULL;
CREATE INDEX idx_ordens_separacao_tempo_conclusao ON ordens_separacao(tempo_conclusao_segundos) WHERE tempo_conclusao_segundos IS NOT NULL;
CREATE INDEX idx_ordens_qualidade_tempo_conclusao ON ordens_qualidade(tempo_conclusao_segundos) WHERE tempo_conclusao_segundos IS NOT NULL;
CREATE INDEX idx_ordens_pintura_tempo_conclusao ON ordens_pintura(tempo_conclusao_segundos) WHERE tempo_conclusao_segundos IS NOT NULL;