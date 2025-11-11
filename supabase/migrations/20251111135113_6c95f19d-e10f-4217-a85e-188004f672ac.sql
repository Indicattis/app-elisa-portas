-- ============================================
-- SIMPLIFICAÇÃO DO SISTEMA DE PERMISSÕES
-- Nova estrutura: Rotas gerenciadas por usuário
-- ============================================

-- 1. Criar tabela de definição de rotas
CREATE TABLE IF NOT EXISTS public.app_routes (
  key TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  "group" TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Criar tabela de acesso de usuários a rotas
CREATE TABLE IF NOT EXISTS public.user_route_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_key TEXT NOT NULL REFERENCES public.app_routes(key) ON DELETE CASCADE,
  can_access BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, route_key)
);

-- 3. Habilitar RLS
ALTER TABLE public.app_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_route_access ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "Admins podem gerenciar rotas"
  ON public.app_routes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'administrador' AND ativo = true
    )
  );

CREATE POLICY "Todos podem ver rotas ativas"
  ON public.app_routes
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins podem gerenciar acessos"
  ON public.user_route_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'administrador' AND ativo = true
    )
  );

CREATE POLICY "Usuários podem ver seus próprios acessos"
  ON public.user_route_access
  FOR SELECT
  USING (user_id = auth.uid());

-- 5. Criar função para verificar acesso a rota
CREATE OR REPLACE FUNCTION public.has_route_access(_user_id uuid, _route_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- Admin tem acesso a tudo
    WHEN EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = _user_id AND role = 'administrador' AND ativo = true
    ) THEN true
    -- Verificar acesso específico do usuário
    WHEN EXISTS (
      SELECT 1 FROM public.user_route_access
      WHERE user_id = _user_id 
        AND route_key = _route_key 
        AND can_access = true
    ) THEN true
    ELSE false
  END;
$$;

-- 6. Popular tabela de rotas com as rotas principais do sistema
INSERT INTO public.app_routes (key, path, label, description, "group", sort_order) VALUES
  -- Grupo: Dashboard
  ('dashboard', '/dashboard', 'Dashboard', 'Visão geral do sistema', 'dashboard', 1),
  ('performance', '/dashboard/performance', 'Performance', 'Análise de desempenho', 'dashboard', 2),
  ('tv_dashboard', '/tv-dashboard', 'TV Dashboard', 'Dashboard modo TV', 'dashboard', 3),
  
  -- Grupo: Vendas
  ('vendas_home', '/vendas', 'Vendas', 'Gestão de vendas', 'vendas', 10),
  ('vendas_nova', '/dashboard/vendas/nova', 'Nova Venda', 'Cadastrar nova venda', 'vendas', 11),
  ('vendas_catalogo', '/dashboard/vendas-catalogo', 'Catálogo', 'Catálogo de produtos', 'vendas', 12),
  ('vendas_forca', '/dashboard/vendas/forca-vendas', 'Força de Vendas', 'Gestão da equipe de vendas', 'vendas', 13),
  ('orcamentos', '/dashboard/orcamentos', 'Orçamentos', 'Gestão de orçamentos', 'vendas', 14),
  ('contador_vendas', '/dashboard/contador-vendas', 'Contador Vendas', 'Contador de vendas do mês', 'vendas', 15),
  
  -- Grupo: Fábrica/Produção
  ('fabrica_home', '/fabrica', 'Fábrica', 'Gestão da fábrica', 'fabrica', 20),
  ('pedidos', '/dashboard/pedidos', 'Pedidos', 'Gestão de pedidos', 'fabrica', 21),
  ('ordens', '/dashboard/ordens', 'Ordens', 'Ordens de produção', 'fabrica', 22),
  ('producao_solda', '/producao/solda', 'Produção - Solda', 'Área de soldagem', 'fabrica', 23),
  ('producao_perfiladeira', '/producao/perfiladeira', 'Produção - Perfiladeira', 'Área de perfiladeira', 'fabrica', 24),
  ('producao_separacao', '/producao/separacao', 'Produção - Separação', 'Área de separação', 'fabrica', 25),
  ('producao_pintura', '/producao/pintura', 'Produção - Pintura', 'Área de pintura', 'fabrica', 26),
  ('producao_qualidade', '/producao/qualidade', 'Produção - Qualidade', 'Controle de qualidade', 'fabrica', 27),
  ('producao_carregamento', '/producao/carregamento', 'Produção - Carregamento', 'Área de carregamento', 'fabrica', 28),
  ('historico_producao', '/dashboard/historico-producao', 'Histórico Produção', 'Histórico de produção', 'fabrica', 29),
  ('etiquetas', '/dashboard/etiquetas', 'Etiquetas', 'Gestão de etiquetas', 'fabrica', 30),
  
  -- Grupo: Instalações
  ('instalacoes_home', '/instalacoes', 'Instalações', 'Gestão de instalações', 'instalacoes', 40),
  ('instalacoes_cadastradas', '/dashboard/instalacoes', 'Instalações Cadastradas', 'Lista de instalações', 'instalacoes', 41),
  ('cronograma_instalacoes', '/dashboard/cronograma-instalacoes', 'Cronograma', 'Cronograma de instalações', 'instalacoes', 42),
  
  -- Grupo: Logística
  ('logistica_home', '/logistica', 'Logística', 'Gestão logística', 'logistica', 50),
  ('entregas', '/dashboard/entregas', 'Entregas', 'Gestão de entregas', 'logistica', 51),
  ('frota', '/dashboard/frota', 'Frota', 'Gestão de veículos', 'logistica', 52),
  
  -- Grupo: Financeiro
  ('faturamento', '/dashboard/faturamento', 'Faturamento', 'Gestão de faturamento', 'financeiro', 60),
  ('dre', '/dashboard/dre', 'DRE', 'Demonstrativo de Resultados', 'financeiro', 61),
  ('despesas', '/dashboard/despesas', 'Despesas', 'Gestão de despesas', 'financeiro', 62),
  ('investimentos', '/dashboard/investimentos', 'Investimentos', 'Gestão de investimentos', 'financeiro', 63),
  
  -- Grupo: Compras/Estoque
  ('compras', '/dashboard/compras', 'Compras', 'Gestão de compras', 'compras', 70),
  ('fornecedores', '/dashboard/fornecedores', 'Fornecedores', 'Gestão de fornecedores', 'compras', 71),
  ('requisicoes_compra', '/dashboard/requisicoes-compra', 'Requisições', 'Requisições de compra', 'compras', 72),
  ('estoque', '/dashboard/estoque', 'Estoque', 'Gestão de estoque', 'compras', 73),
  ('tabela_precos', '/dashboard/tabela-precos', 'Tabela de Preços', 'Gestão de preços', 'compras', 74),
  
  -- Grupo: Marketing/Parceiros
  ('marketing', '/dashboard/marketing', 'Marketing', 'Análises de marketing', 'marketing', 80),
  ('canais_aquisicao', '/dashboard/canais-aquisicao', 'Canais', 'Canais de aquisição', 'marketing', 81),
  ('autorizados', '/dashboard/autorizados', 'Autorizados', 'Parceiros autorizados', 'marketing', 82),
  ('mapa_autorizados', '/dashboard/mapa-autorizados', 'Mapa', 'Mapa de autorizados', 'marketing', 83),
  ('representantes', '/dashboard/representantes', 'Representantes', 'Gestão de representantes', 'marketing', 84),
  ('franqueados', '/dashboard/franqueados', 'Franqueados', 'Gestão de franqueados', 'marketing', 85),
  
  -- Grupo: Administrativo
  ('administrativo_home', '/administrativo', 'Administrativo', 'Área administrativa', 'administrativo', 90),
  ('users', '/dashboard/users', 'Usuários', 'Gestão de usuários', 'administrativo', 91),
  ('rh_admin', '/dashboard/rh-admin', 'RH', 'Recursos Humanos', 'administrativo', 92),
  ('vagas', '/dashboard/vagas', 'Vagas', 'Gestão de vagas', 'administrativo', 93),
  ('documentos', '/dashboard/documentos', 'Documentos', 'Gestão de documentos', 'administrativo', 94),
  ('diario_bordo', '/dashboard/diario-bordo', 'Diário de Bordo', 'Atas e reuniões', 'administrativo', 95),
  ('calendario', '/dashboard/calendario', 'Calendário', 'Calendário de eventos', 'administrativo', 96),
  ('visitas', '/dashboard/visitas', 'Visitas', 'Gestão de visitas', 'administrativo', 97),
  ('todo', '/dashboard/todo', 'Tarefas', 'Lista de tarefas', 'administrativo', 98),
  ('admin', '/admin', 'Admin', 'Configurações do sistema', 'administrativo', 99)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.app_routes IS 'Define todas as rotas disponíveis no sistema';
COMMENT ON TABLE public.user_route_access IS 'Controla o acesso de usuários específicos a rotas específicas';
COMMENT ON FUNCTION public.has_route_access IS 'Verifica se um usuário tem acesso a uma rota específica';