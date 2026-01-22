-- Adicionar campos de aviso de alteração em todas as tabelas de ordens

-- ordens_perfiladeira
ALTER TABLE ordens_perfiladeira ADD COLUMN IF NOT EXISTS projeto_alterado boolean DEFAULT false;
ALTER TABLE ordens_perfiladeira ADD COLUMN IF NOT EXISTS projeto_alterado_em timestamp with time zone;
ALTER TABLE ordens_perfiladeira ADD COLUMN IF NOT EXISTS projeto_alterado_descricao text;

-- ordens_soldagem
ALTER TABLE ordens_soldagem ADD COLUMN IF NOT EXISTS projeto_alterado boolean DEFAULT false;
ALTER TABLE ordens_soldagem ADD COLUMN IF NOT EXISTS projeto_alterado_em timestamp with time zone;
ALTER TABLE ordens_soldagem ADD COLUMN IF NOT EXISTS projeto_alterado_descricao text;

-- ordens_separacao
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS projeto_alterado boolean DEFAULT false;
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS projeto_alterado_em timestamp with time zone;
ALTER TABLE ordens_separacao ADD COLUMN IF NOT EXISTS projeto_alterado_descricao text;

-- ordens_qualidade
ALTER TABLE ordens_qualidade ADD COLUMN IF NOT EXISTS projeto_alterado boolean DEFAULT false;
ALTER TABLE ordens_qualidade ADD COLUMN IF NOT EXISTS projeto_alterado_em timestamp with time zone;
ALTER TABLE ordens_qualidade ADD COLUMN IF NOT EXISTS projeto_alterado_descricao text;

-- ordens_pintura
ALTER TABLE ordens_pintura ADD COLUMN IF NOT EXISTS projeto_alterado boolean DEFAULT false;
ALTER TABLE ordens_pintura ADD COLUMN IF NOT EXISTS projeto_alterado_em timestamp with time zone;
ALTER TABLE ordens_pintura ADD COLUMN IF NOT EXISTS projeto_alterado_descricao text;