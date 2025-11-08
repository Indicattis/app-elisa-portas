-- Criar enum para setores
CREATE TYPE setor_type AS ENUM ('vendas', 'marketing', 'instalacoes', 'fabrica', 'administrativo');

-- Adicionar coluna setor na tabela admin_users
ALTER TABLE public.admin_users
ADD COLUMN setor setor_type;

-- Popular a coluna setor baseado nos roles existentes
UPDATE public.admin_users
SET setor = CASE 
  WHEN role IN ('gerente_comercial', 'coordenador_vendas', 'vendedor') THEN 'vendas'::setor_type
  WHEN role IN ('gerente_marketing', 'analista_marketing', 'assistente_marketing') THEN 'marketing'::setor_type
  WHEN role IN ('gerente_instalacoes', 'instalador', 'aux_instalador') THEN 'instalacoes'::setor_type
  WHEN role IN ('gerente_fabril', 'gerente_producao', 'soldador', 'pintor', 'aux_pintura', 'aux_geral') THEN 'fabrica'::setor_type
  WHEN role IN ('diretor', 'administrador', 'gerente_financeiro', 'assistente_administrativo', 'atendente') THEN 'administrativo'::setor_type
  ELSE NULL
END;

-- Comentário sobre a coluna
COMMENT ON COLUMN public.admin_users.setor IS 'Setor ao qual o usuário pertence: vendas, marketing, instalacoes, fabrica ou administrativo';