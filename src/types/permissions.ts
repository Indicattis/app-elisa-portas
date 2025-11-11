// ============================================
// SISTEMA SIMPLIFICADO DE PERMISSÕES
// ============================================
// Este arquivo contém apenas as definições de cargos (roles) dos usuários.
// O sistema de permissões agora funciona exclusivamente através de:
// - app_routes: Definição de todas as rotas do sistema
// - user_route_access: Controle de acesso por usuário e rota
// - has_route_access(): Única função de verificação de permissão
// - Administradores sempre têm acesso total (via is_admin())

// Role agora é TEXT no banco, validado via FK contra system_roles.key
// Isso permite criar novos roles dinamicamente sem precisar de migrations
export type UserRole = string;

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  created_by: string | null;
}

// Labels dos roles mais comuns
// NOTA: Esta lista não precisa mais estar completa pois roles são dinâmicos
// Os labels devem vir de system_roles.label quando possível
export const ROLE_LABELS: Record<string, string> = {
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
