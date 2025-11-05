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
  | 'contador_vendas'
  | 'configuracoes'
  | 'users'
  | 'autorizados'
  | 'performance'
  | 'tv_dashboard'
  | 'instalacoes'
  | 'documentos'
  | 'diario_bordo'
  | 'estoque'
  | 'compras'
  | 'cronograma_instalacoes'
  | 'rh_admin'
  | 'representantes'
  | 'franqueados'
  | 'investimentos'
  | 'pedidos'
  | 'canais_aquisicao'
  | 'forca_vendas'
  | 'tabela_precos'
  | 'checklist_lideranca'
  | 'aparencia'
  | 'direcao'
  | 'logistica'
  | 'fornecedores'
  | 'vagas'
  | 'dre'
  | 'entregas'
  | 'despesas'
  | 'dp_rh';

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
  },
  estoque: {
    key: 'estoque',
    label: 'Estoque',
    description: 'Gerenciar produtos e controle de estoque'
  },
  compras: {
    key: 'compras',
    label: 'Compras',
    description: 'Gestão de compras e fornecedores'
  },
  cronograma_instalacoes: {
    key: 'cronograma_instalacoes',
    label: 'Cronograma de Instalações',
    description: 'Visualizar e gerenciar cronograma de instalações'
  },
  rh_admin: {
    key: 'rh_admin',
    label: 'RH Admin',
    description: 'Administração de recursos humanos'
  },
  representantes: {
    key: 'representantes',
    label: 'Representantes',
    description: 'Gerenciar representantes comerciais'
  },
  franqueados: {
    key: 'franqueados',
    label: 'Franqueados',
    description: 'Gerenciar rede de franqueados'
  },
  investimentos: {
    key: 'investimentos',
    label: 'Investimentos',
    description: 'Acompanhar investimentos da empresa'
  },
  pedidos: {
    key: 'pedidos',
    label: 'Pedidos',
    description: 'Gerenciar pedidos de produção'
  },
  canais_aquisicao: {
    key: 'canais_aquisicao',
    label: 'Canais de Aquisição',
    description: 'Gerenciar canais de aquisição de clientes'
  },
  forca_vendas: {
    key: 'forca_vendas',
    label: 'Força de Vendas',
    description: 'Acompanhar desempenho da força de vendas'
  },
  tabela_precos: {
    key: 'tabela_precos',
    label: 'Tabela de Preços',
    description: 'Gerenciar tabela de preços das portas'
  },
  checklist_lideranca: {
    key: 'checklist_lideranca',
    label: 'Checklist Liderança',
    description: 'Visualizar e gerenciar tarefas da liderança'
  },
  aparencia: {
    key: 'aparencia',
    label: 'Aparência',
    description: 'Configurar aparência e tema do sistema'
  },
  direcao: {
    key: 'direcao',
    label: 'Direção',
    description: 'Acessar painel executivo de direção'
  },
  logistica: {
    key: 'logistica',
    label: 'Logística',
    description: 'Gerenciar operações de logística'
  },
  fornecedores: {
    key: 'fornecedores',
    label: 'Fornecedores',
    description: 'Cadastrar e gerenciar fornecedores'
  },
  vagas: {
    key: 'vagas',
    label: 'Vagas',
    description: 'Gerenciar vagas e processos seletivos'
  },
  dre: {
    key: 'dre',
    label: 'DRE',
    description: 'Visualizar Demonstrativo de Resultado do Exercício'
  },
  entregas: {
    key: 'entregas',
    label: 'Entregas',
    description: 'Controlar e acompanhar entregas'
  },
  despesas: {
    key: 'despesas',
    label: 'Despesas',
    description: 'Gerenciar despesas mensais'
  },
  dp_rh: {
    key: 'dp_rh',
    label: 'Departamento Pessoal',
    description: 'Administrar folha de pagamento e benefícios'
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