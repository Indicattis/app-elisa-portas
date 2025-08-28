-- Inserir permissões padrão para diferentes roles
-- Administrador tem acesso a tudo
INSERT INTO public.role_permissions (role, permission) VALUES
('administrador', 'dashboard'),
('administrador', 'leads'),
('administrador', 'orcamentos'),
('administrador', 'vendas'),
('administrador', 'producao'),
('administrador', 'calendario'),
('administrador', 'marketing'),
('administrador', 'faturamento'),
('administrador', 'contas_receber'),
('administrador', 'visitas'),
('administrador', 'organograma'),
('administrador', 'contador_vendas'),
('administrador', 'configuracoes'),
('administrador', 'users')
ON CONFLICT (role, permission) DO NOTHING;

-- Diretor tem acesso a quase tudo, exceto configurações de usuários
INSERT INTO public.role_permissions (role, permission) VALUES
('diretor', 'dashboard'),
('diretor', 'leads'),
('diretor', 'orcamentos'),
('diretor', 'vendas'),
('diretor', 'producao'),
('diretor', 'calendario'),
('diretor', 'marketing'),
('diretor', 'faturamento'),
('diretor', 'contas_receber'),
('diretor', 'visitas'),
('diretor', 'organograma'),
('diretor', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Gerente Comercial
INSERT INTO public.role_permissions (role, permission) VALUES
('gerente_comercial', 'dashboard'),
('gerente_comercial', 'leads'),
('gerente_comercial', 'orcamentos'),
('gerente_comercial', 'vendas'),
('gerente_comercial', 'calendario'),
('gerente_comercial', 'marketing'),
('gerente_comercial', 'faturamento'),
('gerente_comercial', 'contas_receber'),
('gerente_comercial', 'visitas'),
('gerente_comercial', 'contador_vendas'),
('gerente_comercial', 'organograma')
ON CONFLICT (role, permission) DO NOTHING;

-- Gerente Fabril
INSERT INTO public.role_permissions (role, permission) VALUES
('gerente_fabril', 'dashboard'),
('gerente_fabril', 'leads'),
('gerente_fabril', 'orcamentos'),
('gerente_fabril', 'vendas'),
('gerente_fabril', 'producao'),
('gerente_fabril', 'calendario'),
('gerente_fabril', 'visitas'),
('gerente_fabril', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Gerente de Produção
INSERT INTO public.role_permissions (role, permission) VALUES
('gerente_producao', 'dashboard'),
('gerente_producao', 'producao'),
('gerente_producao', 'calendario'),
('gerente_producao', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Gerente de Instalações
INSERT INTO public.role_permissions (role, permission) VALUES
('gerente_instalacoes', 'dashboard'),
('gerente_instalacoes', 'producao'),
('gerente_instalacoes', 'calendario'),
('gerente_instalacoes', 'visitas'),
('gerente_instalacoes', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Gerente de Marketing
INSERT INTO public.role_permissions (role, permission) VALUES
('gerente_marketing', 'dashboard'),
('gerente_marketing', 'leads'),
('gerente_marketing', 'marketing'),
('gerente_marketing', 'calendario'),
('gerente_marketing', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Gerente Financeiro
INSERT INTO public.role_permissions (role, permission) VALUES
('gerente_financeiro', 'dashboard'),
('gerente_financeiro', 'faturamento'),
('gerente_financeiro', 'contas_receber'),
('gerente_financeiro', 'calendario'),
('gerente_financeiro', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Coordenador de Vendas
INSERT INTO public.role_permissions (role, permission) VALUES
('coordenador_vendas', 'dashboard'),
('coordenador_vendas', 'leads'),
('coordenador_vendas', 'orcamentos'),
('coordenador_vendas', 'vendas'),
('coordenador_vendas', 'calendario'),
('coordenador_vendas', 'visitas'),
('coordenador_vendas', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Vendedor
INSERT INTO public.role_permissions (role, permission) VALUES
('vendedor', 'dashboard'),
('vendedor', 'leads'),
('vendedor', 'orcamentos'),
('vendedor', 'vendas'),
('vendedor', 'calendario'),
('vendedor', 'visitas'),
('vendedor', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Atendente
INSERT INTO public.role_permissions (role, permission) VALUES
('atendente', 'dashboard'),
('atendente', 'leads'),
('atendente', 'orcamentos'),
('atendente', 'calendario'),
('atendente', 'visitas'),
('atendente', 'contador_vendas')
ON CONFLICT (role, permission) DO NOTHING;

-- Analista de Marketing
INSERT INTO public.role_permissions (role, permission) VALUES
('analista_marketing', 'dashboard'),
('analista_marketing', 'leads'),
('analista_marketing', 'marketing'),
('analista_marketing', 'calendario')
ON CONFLICT (role, permission) DO NOTHING;

-- Assistente de Marketing
INSERT INTO public.role_permissions (role, permission) VALUES
('assistente_marketing', 'dashboard'),
('assistente_marketing', 'leads'),
('assistente_marketing', 'marketing'),
('assistente_marketing', 'calendario')
ON CONFLICT (role, permission) DO NOTHING;

-- Assistente Administrativo
INSERT INTO public.role_permissions (role, permission) VALUES
('assistente_administrativo', 'dashboard'),
('assistente_administrativo', 'leads'),
('assistente_administrativo', 'calendario'),
('assistente_administrativo', 'contas_receber')
ON CONFLICT (role, permission) DO NOTHING;

-- Instalador
INSERT INTO public.role_permissions (role, permission) VALUES
('instalador', 'dashboard'),
('instalador', 'producao'),
('instalador', 'calendario'),
('instalador', 'visitas')
ON CONFLICT (role, permission) DO NOTHING;

-- Auxiliar de Instalador
INSERT INTO public.role_permissions (role, permission) VALUES
('aux_instalador', 'dashboard'),
('aux_instalador', 'producao'),
('aux_instalador', 'calendario')
ON CONFLICT (role, permission) DO NOTHING;

-- Soldador
INSERT INTO public.role_permissions (role, permission) VALUES
('soldador', 'dashboard'),
('soldador', 'producao'),
('soldador', 'calendario')
ON CONFLICT (role, permission) DO NOTHING;

-- Pintor
INSERT INTO public.role_permissions (role, permission) VALUES
('pintor', 'dashboard'),
('pintor', 'producao'),
('pintor', 'calendario')
ON CONFLICT (role, permission) DO NOTHING;

-- Auxiliar de Pintura
INSERT INTO public.role_permissions (role, permission) VALUES
('aux_pintura', 'dashboard'),
('aux_pintura', 'producao'),
('aux_pintura', 'calendario')
ON CONFLICT (role, permission) DO NOTHING;

-- Auxiliar Geral
INSERT INTO public.role_permissions (role, permission) VALUES
('aux_geral', 'dashboard'),
('aux_geral', 'calendario')
ON CONFLICT (role, permission) DO NOTHING;