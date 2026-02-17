export interface Correcao {
  id: string;
  pedido_id: string | null;
  venda_id: string | null;
  nome_cliente: string;
  data_correcao: string | null;
  hora: string | null;
  responsavel_correcao_id: string | null;
  responsavel_correcao_nome: string | null;
  status: 'pendente' | 'agendada' | 'finalizada';
  concluida: boolean;
  concluida_em: string | null;
  concluida_por: string | null;
  observacoes: string | null;
  data_carregamento: string | null;
  hora_carregamento: string | null;
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string | null;
  carregamento_concluido: boolean;
  endereco: string | null;
  cidade: string;
  estado: string;
  cep: string | null;
  telefone_cliente: string | null;
  vezes_agendado: number;
  tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro' | 'instalacao' | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Campos virtuais para compatibilidade com calendário
  _tipo?: 'correcao_pedido';
  // Join data
  pedido?: {
    id: string;
    numero_pedido: string;
  } | null;
}
