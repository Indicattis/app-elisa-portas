
// Novo sistema de status e tags para Leads

export type LeadStatus = 
  | 'aguardando_atendimento'    // 1
  | 'em_andamento'              // 2  
  | 'perdido'                   // 3
  | 'aguardando_aprovacao_venda' // 4
  | 'venda_reprovada'           // 5
  | 'venda_aprovada';           // 6

export type MotivoPerda = 
  | 'desqualificado'
  | 'perdido_por_preco' 
  | 'perdido_por_prazo'
  | 'outro';

export interface LeadTag {
  id: number;
  name: string;
  color: string;
  description: string;
}

export const LEAD_TAGS: LeadTag[] = [
  { id: 1, name: 'Primeiro Contato', color: 'bg-red-900 text-white', description: 'Atendimento (Primeiro contato)' },
  { id: 2, name: 'Segundo Contato', color: 'bg-green-800 text-white', description: 'Atendimento (Segundo contato)' },
  { id: 3, name: 'Propenso', color: 'bg-purple-600 text-white', description: 'Propenso a fechar' },
  { id: 4, name: 'Resgatar', color: 'bg-red-300 text-gray-800', description: 'Resgatar (Última chance)' },
  { id: 5, name: 'Aguardando Obra', color: 'bg-yellow-400 text-gray-800', description: 'Aguardando obra (Trello)' },
  { id: 6, name: 'Visita', color: 'bg-blue-300 text-gray-800', description: 'Visita' },
  { id: 7, name: 'Cliente Fechado', color: 'bg-green-600 text-white', description: 'Cliente fechado' },
  { id: 8, name: 'Perdido', color: 'bg-red-600 text-white', description: 'Perdido! (Perda de tempo)' },
  { id: 9, name: 'Aguardando Gerência', color: 'bg-orange-500 text-white', description: 'Aguardando gerência' }
];

export const STATUS_CONFIG: Record<LeadStatus, {
  label: string;
  className: string;
  description: string;
  numericValue: number;
}> = {
  'aguardando_atendimento': {
    label: 'Aguardando Atendimento',
    className: 'bg-blue-500',
    description: 'Lead aguardando ser capturado por um atendente',
    numericValue: 1
  },
  'em_andamento': {
    label: 'Em Andamento', 
    className: 'bg-yellow-500',
    description: 'Lead sendo atendido',
    numericValue: 2
  },
  'perdido': {
    label: 'Perdido',
    className: 'bg-red-500', 
    description: 'Lead perdido',
    numericValue: 3
  },
  'aguardando_aprovacao_venda': {
    label: 'Aguardando Aprovação de Venda',
    className: 'bg-purple-500',
    description: 'Aguardando aprovação da gerência para venda',
    numericValue: 4
  },
  'venda_reprovada': {
    label: 'Venda Reprovada',
    className: 'bg-red-600',
    description: 'Venda reprovada pela gerência', 
    numericValue: 5
  },
  'venda_aprovada': {
    label: 'Venda Aprovada',
    className: 'bg-green-500',
    description: 'Venda aprovada e finalizada',
    numericValue: 6
  }
};

export const MOTIVO_PERDA_CONFIG: Record<MotivoPerda, string> = {
  'desqualificado': 'Desqualificado',
  'perdido_por_preco': 'Perdido por preço',
  'perdido_por_prazo': 'Perdido por prazo', 
  'outro': 'Outro motivo'
};

export function getLeadTag(tagId: number | null): LeadTag | null {
  if (!tagId) return null;
  return LEAD_TAGS.find(tag => tag.id === tagId) || null;
}

export function canEditTag(status: LeadStatus): boolean {
  return ['aguardando_atendimento', 'em_andamento'].includes(status);
}

export function canChangeStatus(currentStatus: LeadStatus, newStatus: LeadStatus, isAdmin: boolean): boolean {
  // Admins podem fazer qualquer mudança
  if (isAdmin) return true;
  
  // Regras específicas baseadas no status atual
  switch (currentStatus) {
    case 'aguardando_atendimento':
      return newStatus === 'em_andamento';
    case 'em_andamento':
      return ['perdido', 'aguardando_aprovacao_venda'].includes(newStatus);
    case 'perdido':
      return false; // Apenas admins podem retomar
    case 'venda_reprovada':
      return false; // Apenas admins podem retomar
    case 'aguardando_aprovacao_venda':
      return ['perdido', 'venda_aprovada', 'venda_reprovada'].includes(newStatus);
    default:
      return false;
  }
}
