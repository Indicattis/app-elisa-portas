-- Adicionar campo equipe_id na tabela instalacoes
ALTER TABLE instalacoes 
ADD COLUMN equipe_id UUID REFERENCES equipes_instalacao(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_instalacoes_equipe_id ON instalacoes(equipe_id);