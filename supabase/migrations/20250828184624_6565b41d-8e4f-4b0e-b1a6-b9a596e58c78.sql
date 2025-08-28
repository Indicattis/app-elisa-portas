-- Adicionar as novas roles ao enum user_role
ALTER TYPE user_role ADD VALUE 'diretor';
ALTER TYPE user_role ADD VALUE 'gerente_marketing';
ALTER TYPE user_role ADD VALUE 'gerente_financeiro';
ALTER TYPE user_role ADD VALUE 'gerente_producao';
ALTER TYPE user_role ADD VALUE 'gerente_instalacoes';
ALTER TYPE user_role ADD VALUE 'instalador';
ALTER TYPE user_role ADD VALUE 'aux_instalador';
ALTER TYPE user_role ADD VALUE 'analista_marketing';
ALTER TYPE user_role ADD VALUE 'assistente_marketing';
ALTER TYPE user_role ADD VALUE 'coordenador_vendas';
ALTER TYPE user_role ADD VALUE 'vendedor';
ALTER TYPE user_role ADD VALUE 'assistente_administrativo';
ALTER TYPE user_role ADD VALUE 'soldador';
ALTER TYPE user_role ADD VALUE 'aux_geral';
ALTER TYPE user_role ADD VALUE 'pintor';
ALTER TYPE user_role ADD VALUE 'aux_pintura';