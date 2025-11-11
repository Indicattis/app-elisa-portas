// ============================================
// SISTEMA SIMPLIFICADO DE PERMISSÕES
// ============================================
// Este arquivo contém apenas as definições de cargos (roles) dos usuários.
// O sistema de permissões agora funciona exclusivamente através de:
// - app_routes: Definição de todas as rotas do sistema
// - user_route_access: Controle de acesso por usuário e rota
// - has_route_access(): Única função de verificação de permissão
// - Administradores sempre têm acesso total (via is_admin())

export type UserRole = 
  | 'administrador' 
  | 'gerente_comercial' 
  | 'gerente_fabril' 
  | 'atendente' 
  | 'diretor' 
  | 'gerente_marketing' 
  | 'gerente_financeiro' 
  | 'gerente_producao' 
  | 'gerente_instalacoes' 
  | 'instalador' 
  | 'aux_instalador' 
  | 'analista_marketing' 
  | 'assistente_marketing' 
  | 'coordenador_vendas' 
  | 'vendedor' 
  | 'assistente_administrativo' 
  | 'soldador' 
  | 'aux_geral' 
  | 'pintor' 
  | 'aux_pintura'
  | 'tecnico_qualidade';

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  created_by: string | null;
}

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
  aux_pintura: 'Aux. Pintura',
  tecnico_qualidade: 'Técnico de Qualidade'
};
