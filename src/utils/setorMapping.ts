import { UserRole } from "@/types/permissions";

export const SETOR_ROLES: Record<string, UserRole[]> = {
  vendas: ['gerente_comercial', 'coordenador_vendas', 'vendedor', 'atendente'],
  marketing: ['gerente_marketing', 'analista_marketing', 'assistente_marketing'],
  instalacoes: ['gerente_instalacoes', 'instalador', 'aux_instalador'],
  fabrica: ['gerente_fabril', 'gerente_producao', 'soldador', 'pintor', 'aux_pintura', 'aux_geral'],
  administrativo: ['diretor', 'administrador', 'gerente_financeiro', 'assistente_administrativo']
};

export const SETOR_LABELS: Record<string, string> = {
  vendas: 'Vendas',
  marketing: 'Marketing',
  instalacoes: 'Instalações',
  fabrica: 'Fábrica',
  administrativo: 'Administrativo'
};

export function getSetorFromRole(role: UserRole): string | null {
  for (const [setor, roles] of Object.entries(SETOR_ROLES)) {
    if (roles.includes(role)) {
      return setor;
    }
  }
  return null;
}

export function getRolesFromSetor(setor: string): UserRole[] {
  return SETOR_ROLES[setor as keyof typeof SETOR_ROLES] || [];
}
