

export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  novo_status: 'aguardando_atendimento' | 'em_andamento' | 'perdido' | 'aguardando_aprovacao_venda' | 'venda_reprovada' | 'venda_aprovada';
  tag_id: number | null;
  motivo_perda: 'desqualificado' | 'perdido_por_preco' | 'perdido_por_prazo' | 'outro' | null;
  observacoes_perda: string | null;
  data_envio: string;
  atendente_id: string | null;
  valor_orcamento: number | null;
  tipo_porta: string | null;
  data_inicio_atendimento: string | null;
  canal_aquisicao: string;
  canal_aquisicao_id: string | null;
  observacoes: string | null;
  canais_aquisicao?: {
    id: string;
    nome: string;
  };
}

export interface FilterValues {
  search: string;
  status: string;
  atendente: string;
  cidade: string;
  dataInicio: string;
  dataFim: string;
  etiqueta: string;
}

export const LEADS_PER_PAGE = 22;

