export type EtapaPedido = 
  | 'aberto'
  | 'em_producao'
  | 'inspecao_qualidade'
  | 'aguardando_pintura'
  | 'aguardando_coleta'
  | 'aguardando_instalacao'
  | 'finalizado';

export interface PedidoCheckbox {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
  checked_at?: string;
  checked_by?: string;
}

export interface PedidoEtapa {
  id: string;
  pedido_id: string;
  etapa: EtapaPedido;
  checkboxes: PedidoCheckbox[];
  data_entrada: string;
  data_saida?: string;
  created_at: string;
  updated_at: string;
}

export const ETAPAS_CONFIG: Record<EtapaPedido, {
  label: string;
  color: string;
  icon: string;
  checkboxes: Omit<PedidoCheckbox, 'checked' | 'checked_at' | 'checked_by'>[];
}> = {
  aberto: {
    label: 'Pedidos em Aberto',
    color: 'bg-yellow-500',
    icon: 'Clock',
    checkboxes: []
  },
  em_producao: {
    label: 'Em Produção',
    color: 'bg-blue-500',
    icon: 'Factory',
    checkboxes: [
      { id: 'materiais_separados', label: 'Materiais separados', required: true },
      { id: 'ordem_iniciada', label: 'Ordem iniciada', required: true }
    ]
  },
  inspecao_qualidade: {
    label: 'Inspeção de Qualidade',
    color: 'bg-purple-500',
    icon: 'ClipboardCheck',
    checkboxes: [
      { id: 'medidas_conferidas', label: 'Medidas conferidas', required: true },
      { id: 'acabamento_ok', label: 'Acabamento OK', required: true },
      { id: 'funcionamento_ok', label: 'Funcionamento OK', required: true }
    ]
  },
  aguardando_pintura: {
    label: 'Aguardando Pintura',
    color: 'bg-orange-500',
    icon: 'Paintbrush',
    checkboxes: [
      { id: 'cor_definida', label: 'Cor definida', required: true },
      { id: 'superficie_preparada', label: 'Superfície preparada', required: true }
    ]
  },
  aguardando_coleta: {
    label: 'Aguardando Coleta',
    color: 'bg-indigo-500',
    icon: 'Package',
    checkboxes: [
      { id: 'produtos_embalados', label: 'Produtos embalados', required: true },
      { id: 'nota_fiscal_emitida', label: 'Nota fiscal emitida', required: true }
    ]
  },
  aguardando_instalacao: {
    label: 'Aguardando Instalação',
    color: 'bg-cyan-500',
    icon: 'Wrench',
    checkboxes: [
      { id: 'equipe_escalada', label: 'Equipe escalada', required: true },
      { id: 'cliente_contatado', label: 'Cliente contatado', required: true }
    ]
  },
  finalizado: {
    label: 'Finalizado',
    color: 'bg-green-500',
    icon: 'CheckCircle2',
    checkboxes: []
  }
};

export const ORDEM_ETAPAS: EtapaPedido[] = [
  'aberto',
  'em_producao',
  'inspecao_qualidade',
  'aguardando_pintura',
  'aguardando_coleta',
  'aguardando_instalacao',
  'finalizado'
];

export function getProximaEtapa(etapaAtual: EtapaPedido): EtapaPedido | null {
  const indiceAtual = ORDEM_ETAPAS.indexOf(etapaAtual);
  if (indiceAtual === -1 || indiceAtual === ORDEM_ETAPAS.length - 1) {
    return null;
  }
  return ORDEM_ETAPAS[indiceAtual + 1];
}

// Tipos para sistema de prioridade
export interface PrioridadeUpdate {
  id: string;
  prioridade: number;
}

export type DirecaoPrioridade = 'frente' | 'tras';
