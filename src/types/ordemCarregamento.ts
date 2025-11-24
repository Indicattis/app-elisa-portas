export interface OrdemCarregamento {
  id: string;
  pedido_id: string | null;
  venda_id: string | null;
  nome_cliente: string;
  tipo_carregamento: 'entrega' | 'instalacao' | null;
  data_carregamento: string | null;
  hora: string | null;
  responsavel_tipo: 'elisa' | 'autorizado' | null;
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string | null;
  status: string | null;
  carregamento_concluido: boolean | null;
  carregamento_concluido_em: string | null;
  carregamento_concluido_por: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_precision: string | null;
  last_geocoded_at: string | null;
  observacoes: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  pedido?: {
    id: string;
    numero_pedido: string;
    etapa_atual: string;
    data_producao: string | null;
  };
  venda?: {
    id: string;
    cliente_nome: string;
    cliente_telefone: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    endereco_completo: string | null;
    bairro: string | null;
    data_prevista_entrega: string | null;
  };
}

export interface AgendarCarregamentoData {
  data_carregamento: string;
  hora: string;
  responsavel_tipo: 'elisa' | 'autorizado';
  responsavel_carregamento_id: string;
  responsavel_carregamento_nome: string;
}
