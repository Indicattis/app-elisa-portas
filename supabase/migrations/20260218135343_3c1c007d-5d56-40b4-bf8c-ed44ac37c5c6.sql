ALTER TABLE pontuacao_colaboradores
  DROP CONSTRAINT pontuacao_colaboradores_tipo_ranking_check;

ALTER TABLE pontuacao_colaboradores
  ADD CONSTRAINT pontuacao_colaboradores_tipo_ranking_check
  CHECK (tipo_ranking = ANY (ARRAY['pintura', 'perfiladeira', 'solda', 'separacao']));