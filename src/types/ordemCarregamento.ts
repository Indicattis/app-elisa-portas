export interface OrdemCarregamento {
  id: string;
  pedido_id: string | null;
  venda_id: string | null;
  nome_cliente: string;
  data_carregamento: string | null;
  hora: string;
  hora_carregamento: string | null;
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string | null;
  tipo_carregamento: 'elisa' | 'autorizados' | null;
  carregamento_concluido: boolean;
  carregamento_concluido_em: string | null;
  carregamento_concluido_por: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  latitude: number | null;
  longitude: number | null;
  last_geocoded_at: string | null;
  geocode_precision: string | null;
  // Relacionamentos
  pedido?: PedidoSimplificado;
  venda?: VendaSimplificada;
}

export interface PedidoSimplificado {
  id: string;
  numero_pedido: string;
  etapa_atual: string;
  status?: string;
}

export interface VendaSimplificada {
  id: string;
  cliente_nome: string;
  cliente_telefone?: string | null;
  cliente_email?: string | null;
  estado?: string | null;
  cidade?: string | null;
  cep?: string | null;
  endereco_completo?: string | null;
  bairro?: string | null;
  data_venda: string;
  produtos?: Array<{
    tipo_produto: string;
    descricao: string;
    quantidade: number;
    tamanho?: string;
  }>;
}

export interface OrdemCarregamentoFormData {
  pedido_id: string;
  venda_id: string | null;
  nome_cliente: string;
  data_carregamento: string;
  hora_carregamento: string;
  tipo_carregamento: 'elisa' | 'autorizados';
  responsavel_carregamento_id: string;
  responsavel_carregamento_nome: string;
}

export type ResponsavelCarregamentoTipo = 'equipe_interna' | 'autorizado';

export interface ResponsavelCarregamento {
  tipo: ResponsavelCarregamentoTipo;
  id: string;
  nome: string;
  cor?: string; // Para equipes internas
  cidade?: string; // Para autorizados
  estado?: string; // Para autorizados
}

export type EtapaExpedicao = 'aguardando_coleta' | 'aguardando_instalacao';

export const ETAPAS_EXPEDICAO: Record<EtapaExpedicao, string> = {
  aguardando_coleta: 'Expedição Coleta',
  aguardando_instalacao: 'Expedição Instalação'
};

export const isEtapaExpedicao = (etapa: string): etapa is EtapaExpedicao => {
  return etapa === 'aguardando_coleta' || etapa === 'aguardando_instalacao';
};
