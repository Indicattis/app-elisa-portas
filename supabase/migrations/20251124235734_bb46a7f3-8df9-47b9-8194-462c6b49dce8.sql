-- Remove a constraint de foreign key que está causando problemas
-- A coluna responsavel_carregamento_id precisa aceitar IDs de diferentes tabelas
-- dependendo do responsavel_tipo (elisa = admin_users, autorizados = autorizados)
ALTER TABLE ordens_carregamento 
DROP CONSTRAINT IF EXISTS instalacoes_equipe_id_fkey;

-- Adicionar comentário explicativo
COMMENT ON COLUMN ordens_carregamento.responsavel_carregamento_id IS 
  'ID do responsável - pode ser de admin_users (quando responsavel_tipo=elisa) ou autorizados (quando responsavel_tipo=autorizados)';
