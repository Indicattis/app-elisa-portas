-- Criar tabela para armazenar configuração das abas
CREATE TABLE public.app_tabs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  href text NOT NULL,
  permission app_permission,
  tab_group text NOT NULL DEFAULT 'sidebar',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Habilitar RLS
ALTER TABLE public.app_tabs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver abas ativas"
ON public.app_tabs
FOR SELECT
TO authenticated
USING (active = true);

CREATE POLICY "Admins podem gerenciar abas"
ON public.app_tabs
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'configuracoes'));

-- Trigger para updated_at
CREATE TRIGGER update_app_tabs_updated_at
BEFORE UPDATE ON public.app_tabs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar view para calcular acesso do usuário
CREATE VIEW public.user_tab_access AS
SELECT 
  t.*,
  CASE 
    WHEN t.permission IS NULL THEN true
    ELSE has_permission(auth.uid(), t.permission)
  END as can_access
FROM public.app_tabs t
WHERE t.active = true
ORDER BY t.sort_order, t.label;

-- Popular com as abas existentes do sidebar
INSERT INTO public.app_tabs (key, label, href, permission, sort_order, icon) VALUES
('dashboard', 'Dashboard', '/dashboard', 'dashboard', 1, 'LayoutDashboard'),
('performance', 'Performance', '/dashboard/performance', 'dashboard', 2, 'BarChart3'),
('leads', 'Leads', '/dashboard/leads', 'leads', 3, 'FileText'),
('orcamentos', 'Orçamentos', '/dashboard/orcamentos', 'orcamentos', 4, 'Calculator'),
('pedidos', 'Pedidos', '/dashboard/pedidos', 'vendas', 5, 'FileText'),
('visitas', 'Visitas', '/dashboard/visitas', 'visitas', 6, 'Calendar'),
('producao', 'Produção', '/dashboard/producao', 'producao', 7, 'Factory'),
('instalacoes', 'Instalações', '/dashboard/instalacoes', 'producao', 8, 'Calendar'),
('faturamento', 'Faturamento', '/dashboard/faturamento', 'faturamento', 9, 'LayoutDashboard'),
('marketing', 'Marketing', '/dashboard/marketing', 'marketing', 10, 'TrendingUp'),
('contas_receber', 'Contas a Receber', '/dashboard/contas-receber', 'contas_receber', 11, 'CreditCard'),
('organograma', 'Organograma', '/dashboard/organograma', 'organograma', 12, 'Users'),
('calendario', 'Calendário', '/dashboard/calendario', 'calendario', 13, 'CalendarDays'),
('contador_vendas', 'Contador de vendas', '/dashboard/contador-vendas', 'contador_vendas', 14, 'DollarSign'),
('autorizados', 'Autorizados', '/dashboard/autorizados', 'users', 15, 'Users'),
('configuracoes', 'Configurações', '/dashboard/configuracoes', 'configuracoes', 16, 'Settings');

-- Popular com as abas de configurações
INSERT INTO public.app_tabs (key, label, href, permission, tab_group, sort_order, icon) VALUES
('config_canais', 'Canais de Aquisição', '/dashboard/configuracoes#canais', 'configuracoes', 'settings', 1, 'Megaphone'),
('config_investimentos', 'Investimentos Marketing', '/dashboard/configuracoes#investimentos', 'marketing', 'settings', 2, 'TrendingUp'),
('config_aparencia', 'Aparência', '/dashboard/configuracoes#aparencia', null, 'settings', 3, 'Palette'),
('config_usuarios', 'Usuários', '/dashboard/configuracoes#usuarios', 'users', 'settings', 4, 'Users'),
('config_permissoes', 'Permissões', '/dashboard/configuracoes#permissoes', 'users', 'settings', 5, 'Shield'),
('config_sistema', 'Sistema', '/dashboard/configuracoes#sistema', 'configuracoes', 'settings', 6, 'Settings');