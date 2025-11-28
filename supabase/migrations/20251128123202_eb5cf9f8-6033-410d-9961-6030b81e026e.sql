-- Adicionar colunas de pontuação na tabela estoque
ALTER TABLE estoque 
ADD COLUMN pontuacao_producao NUMERIC DEFAULT 0,
ADD COLUMN pontuacao_por_metro NUMERIC DEFAULT 0;

COMMENT ON COLUMN estoque.pontuacao_producao IS 'Pontos ganhos por unidade produzida';
COMMENT ON COLUMN estoque.pontuacao_por_metro IS 'Pontos extras por metro trabalhado';

-- Criar tabela de pontuação dos colaboradores
CREATE TABLE pontuacao_colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  linha_id UUID NOT NULL REFERENCES linhas_ordens(id),
  ordem_id UUID NOT NULL,
  tipo_ordem TEXT NOT NULL,
  estoque_id UUID REFERENCES estoque(id),
  item_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  metragem NUMERIC DEFAULT 0,
  pontos_unidade NUMERIC NOT NULL DEFAULT 0,
  pontos_metro NUMERIC NOT NULL DEFAULT 0,
  pontos_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para melhorar performance
CREATE INDEX idx_pontuacao_colaboradores_user_id ON pontuacao_colaboradores(user_id);
CREATE INDEX idx_pontuacao_colaboradores_created_at ON pontuacao_colaboradores(created_at);
CREATE INDEX idx_pontuacao_colaboradores_tipo_ordem ON pontuacao_colaboradores(tipo_ordem);

-- RLS para pontuacao_colaboradores
ALTER TABLE pontuacao_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pontuacao"
  ON pontuacao_colaboradores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert pontuacao"
  ON pontuacao_colaboradores FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Função RPC para buscar ranking do mês
CREATE OR REPLACE FUNCTION get_ranking_pontuacao_mes()
RETURNS TABLE (
  user_id UUID,
  nome TEXT,
  foto_perfil_url TEXT,
  total_pontos NUMERIC,
  total_linhas BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    au.nome,
    au.foto_perfil_url,
    SUM(p.pontos_total) as total_pontos,
    COUNT(*) as total_linhas
  FROM pontuacao_colaboradores p
  JOIN admin_users au ON au.user_id = p.user_id
  WHERE p.created_at >= date_trunc('month', CURRENT_DATE)
  GROUP BY p.user_id, au.nome, au.foto_perfil_url
  ORDER BY total_pontos DESC
  LIMIT 10;
END;
$$;