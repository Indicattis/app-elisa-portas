export interface PedidoPortaSocialObservacoes {
  id: string;
  pedido_id: string;
  produto_venda_id: string;
  indice_porta: number;
  
  // Medidas da porta
  altura_menor_porta: number | null;
  espessura_parede: number | null;
  largura_1: number | null;
  largura_2: number | null;
  largura_3: number | null;
  largura_menor_porta: number | null;
  
  // Painel
  tem_painel: boolean;
  largura_painel: number | null;
  altura_painel: number | null;
  
  // Configurações
  lado_fechadura: 'direita' | 'esquerda' | null;
  lado_abertura: 'fora' | 'dentro' | null;
  acabamento: 'perfil_u' | 'normal' | null;
  
  created_at: string;
  updated_at: string;
}

export interface PedidoPortaSocialObservacoesInsert {
  pedido_id: string;
  produto_venda_id: string;
  indice_porta?: number;
  altura_menor_porta?: number | null;
  espessura_parede?: number | null;
  largura_1?: number | null;
  largura_2?: number | null;
  largura_3?: number | null;
  largura_menor_porta?: number | null;
  tem_painel?: boolean;
  largura_painel?: number | null;
  altura_painel?: number | null;
  lado_fechadura?: 'direita' | 'esquerda' | null;
  lado_abertura?: 'fora' | 'dentro' | null;
  acabamento?: 'perfil_u' | 'normal' | null;
}

// Opções para os selects
export const OPCOES_LADO_FECHADURA: Record<string, string> = {
  direita: 'Direita',
  esquerda: 'Esquerda',
};

export const OPCOES_LADO_ABERTURA: Record<string, string> = {
  fora: 'Fora',
  dentro: 'Dentro',
};

export const OPCOES_ACABAMENTO: Record<string, string> = {
  perfil_u: 'Perfil U',
  normal: 'Normal',
};
