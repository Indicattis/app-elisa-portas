
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
    bgColor: '#7C2D12', // Bordô
    textColor: 'text-white'
  },
  {
    id: 'propenso_fechar',
    name: 'Propenso a fechar',
    color: 'border-purple-600',
    bgColor: '#9333EA', // Roxo
    textColor: 'text-white'
  },
  {
    id: 'atendimento_segundo',
    name: 'Atendimento (Segundo contato)',
    color: 'border-green-800',
    bgColor: '#166534', // Verde escuro
    textColor: 'text-white'
  },
  {
    id: 'resgatar',
    name: 'Resgatar (Última chance)',
    color: 'border-red-400',
    bgColor: '#F87171', // Vermelho claro
    textColor: 'text-white'
  },
  {
    id: 'perdido',
    name: 'Perdido! (Perda de tempo)',
    color: 'border-red-600',
    bgColor: '#DC2626', // Vermelho forte
    textColor: 'text-white'
  },
  {
    id: 'aguardando_obra',
    name: 'Aguardando obra (Trello)',
    color: 'border-yellow-500',
    bgColor: '#EAB308', // Amarelo
    textColor: 'text-black'
  },
  {
    id: 'visita',
    name: 'Visita',
    color: 'border-green-400',
    bgColor: '#4ADE80', // Verde claro
    textColor: 'text-black'
  },
  {
    id: 'aguardando_aprovacao',
    name: 'Aguardando aprovação de venda',
    color: 'border-blue-500',
    bgColor: '#3B82F6', // Azul
    textColor: 'text-white'
  },
  {
    id: 'cliente_fechado',
    name: 'Cliente fechado',
    color: 'border-green-600',
    bgColor: '#16A34A', // Verde forte para indicar venda
    textColor: 'text-white'
  }
];

export const getTagById = (id: string): LeadTag | undefined => {
  return leadTags.find(tag => tag.id === id);
};

// Função para obter apenas uma tag (primeira do array)
export const getLeadTag = (tags: string[]): LeadTag | null => {
  if (!tags || tags.length === 0) return null;
  return getTagById(tags[0]) || null;
};
