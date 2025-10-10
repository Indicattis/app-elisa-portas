export type UserRole = 'administrador' | 'gerente_comercial' | 'gerente_fabril' | 'atendente' | 'diretor' | 'gerente_marketing' | 'gerente_financeiro' | 'gerente_producao' | 'gerente_instalacoes' | 'instalador' | 'aux_instalador' | 'analista_marketing' | 'assistente_marketing' | 'coordenador_vendas' | 'vendedor' | 'assistente_administrativo' | 'soldador' | 'aux_geral' | 'pintor' | 'aux_pintura';

export type AppPermission = 
  | 'dashboard'
  | 'leads'
  | 'orcamentos'
  | 'vendas'
  | 'producao'
  | 'calendario'
  | 'marketing'
  | 'faturamento'
  | 'contas_receber'
  | 'visitas'
  | 'organograma'
  | 'contador_vendas'
  | 'configuracoes'
  | 'users'
  | 'autorizados'
  | 'performance'
  | 'tv_dashboard'
  | 'instalacoes'
  | 'documentos'
  | 'diario_bordo';

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  created_by: string | null;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission: AppPermission;
  created_at: string;
  created_by: string | null;
}

export interface PermissionDisplay {
  key: AppPermission;
  label: string;
  description: string;
}

export const PERMISSION_LABELS: Record<AppPermission, PermissionDisplay> = {
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Acesso à página principal com métricas e resumos'
  },
  leads: {
    key: 'leads',
    label: 'Leads',
    description: 'Gerenciar leads e atendimentos'
  },
  orcamentos: {
    key: 'orcamentos',
    label: 'Orçamentos',
    description: 'Criar e gerenciar orçamentos'
  },
  vendas: {
    key: 'vendas',
    label: 'Vendas',
    description: 'Acompanhar e gerenciar vendas'
  },
  producao: {
    key: 'producao',
    label: 'Produção',
    description: 'Gerenciar ordens de produção'
  },
  calendario: {
    key: 'calendario',
    label: 'Calendário',
    description: 'Visualizar e gerenciar eventos'
  },
  marketing: {
    key: 'marketing',
    label: 'Marketing',
    description: 'Acompanhar investimentos em marketing'
  },
  faturamento: {
    key: 'faturamento',
    label: 'Faturamento',
    description: 'Relatórios de faturamento'
  },
  contas_receber: {
    key: 'contas_receber',
    label: 'Contas a Receber',
    description: 'Gerenciar contas a receber'
  },
  visitas: {
    key: 'visitas',
    label: 'Visitas Técnicas',
    description: 'Agendar e gerenciar visitas técnicas'
  },
  organograma: {
    key: 'organograma',
    label: 'Organograma',
    description: 'Visualizar organograma da empresa'
  },
  contador_vendas: {
    key: 'contador_vendas',
    label: 'Contador de Vendas',
    description: 'Registrar e acompanhar vendas diárias'
  },
  configuracoes: {
    key: 'configuracoes',
    label: 'Configurações',
    description: 'Acessar configurações do sistema'
  },
  users: {
    key: 'users',
    label: 'Usuários',
    description: 'Gerenciar usuários e permissões'
  },
  autorizados: {
    key: 'autorizados',
    label: 'Autorizados',
    description: 'Gerenciar rede de autorizados'
  },
  performance: {
    key: 'performance',
    label: 'Performance',
    description: 'Visualizar relatórios de performance'
  },
  tv_dashboard: {
    key: 'tv_dashboard',
    label: 'Modo TV',
    description: 'Acessar o dashboard em modo TV'
  },
  instalacoes: {
    key: 'instalacoes',
    label: 'Instalações',
    description: 'Gerenciar cronograma e ordens de instalação'
  },
  documentos: {
    key: 'documentos',
    label: 'Documentos',
    description: 'Gerenciar e visualizar documentos públicos'
  },
  diario_bordo: {
    key: 'diario_bordo',
    label: 'Diário de Bordo',
    description: 'Registrar e visualizar atas de reuniões'
  }
};

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  gerente_comercial: 'Gerente Comercial',
  gerente_fabril: 'Gerente Fabril',
  atendente: 'Atendente',
  diretor: 'Diretor',
  gerente_marketing: 'Gerente de Marketing',
  gerente_financeiro: 'Gerente Financeiro',
  gerente_producao: 'Gerente de Produção',
  gerente_instalacoes: 'Gerente de Instalações',
  instalador: 'Instalador',
  aux_instalador: 'Aux. Instalador',
  analista_marketing: 'Analista de Marketing',
  assistente_marketing: 'Assistente de Marketing',
  coordenador_vendas: 'Coordenador(a) de Vendas',
  vendedor: 'Vendedor(a)',
  assistente_administrativo: 'Assistente Administrativo',
  soldador: 'Soldador',
  aux_geral: 'Aux. Geral',
  pintor: 'Pintor(a)',
  aux_pintura: 'Aux. Pintura'
};