
export interface LeadTag {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const leadTags: LeadTag[] = [
  {
    id: 'atendimento_primeiro',
    name: 'Atendimento (Primeiro contato)',
    color: 'border-red-900',
    bgColor: 'bg-red-900',
    textColor: 'text-white'
  },
  {
    id: 'propenso_fechar',
    name: 'Propenso a fechar',
    color: 'border-purple-600',
    bgColor: 'bg-purple-600',
    textColor: 'text-white'
  },
  {
    id: 'atendimento_segundo',
    name: 'Atendimento (Segundo contato)',
    color: 'border-green-800',
    bgColor: 'bg-green-800',
    textColor: 'text-white'
  },
  {
    id: 'resgatar',
    name: 'Resgatar (Última chance)',
    color: 'border-red-400',
    bgColor: 'bg-red-400',
    textColor: 'text-white'
  },
  {
    id: 'perdido',
    name: 'Perdido! (Perda de tempo)',
    color: 'border-red-600',
    bgColor: 'bg-red-600',
    textColor: 'text-white'
  },
  {
    id: 'aguardando_obra',
    name: 'Aguardando obra (Trello)',
    color: 'border-yellow-500',
    bgColor: 'bg-yellow-500',
    textColor: 'text-black'
  },
  {
    id: 'visita',
    name: 'Visita',
    color: 'border-green-400',
    bgColor: 'bg-green-400',
    textColor: 'text-black'
  },
  {
    id: 'aguardando_aprovacao',
    name: 'Aguardando aprovação de venda',
    color: 'border-blue-500',
    bgColor: 'bg-blue-500',
    textColor: 'text-white'
  },
  {
    id: 'cliente_fechado',
    name: 'Cliente fechado',
    color: 'border-gray-500',
    bgColor: 'bg-gray-500',
    textColor: 'text-white'
  }
];

export const getTagById = (id: string): LeadTag | undefined => {
  return leadTags.find(tag => tag.id === id);
};

export const getTagsByIds = (ids: string[]): LeadTag[] => {
  return ids.map(id => getTagById(id)).filter(Boolean) as LeadTag[];
};
