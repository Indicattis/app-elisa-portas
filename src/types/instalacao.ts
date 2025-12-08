export interface Instalacao {
  id: string;
  id_venda: string | null;
  nome_cliente: string;
  data?: string | null;
  hora: string;
  equipe_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  venda?: VendaSimplificada;
  equipe?: EquipeInstalacao;
  pedido?: {
    id: string;
    numero_pedido: string;
    etapa_atual: string;
  };
  // Campos específicos da instalação
  venda_id?: string | null;
  pedido_id?: string | null;
  responsavel_instalacao_id?: string | null;
  responsavel_instalacao_nome?: string | null;
  status?: string;
  tipo_instalacao?: 'elisa' | 'autorizados' | null;
  instalacao_concluida?: boolean;
  instalacao_concluida_em?: string | null;
  instalacao_concluida_por?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  last_geocoded_at?: string | null;
  geocode_precision?: string | null;
  // Novos campos de localização e cliente
  cep?: string | null;
  endereco?: string | null;
  estado?: string | null;
  cidade?: string | null;
  telefone_cliente?: string | null;
  cor_id?: string | null;
  observacoes?: string | null;
}

export interface EquipeInstalacao {
  id: string;
  nome: string;
  cor: string | null;
  ativa: boolean;
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

export interface InstalacaoFormData {
  id_venda: string | null;
  nome_cliente: string;
  data: string;
  hora: string;
  equipe_id: string;
  // Novos campos
  cep?: string;
  endereco?: string;
  estado?: string;
  cidade?: string;
  telefone_cliente?: string;
  cor_id?: string;
  observacoes?: string;
}

export type ResponsavelInstalacaoTipo = 'equipe_interna' | 'autorizado';

export interface ResponsavelInstalacao {
  tipo: ResponsavelInstalacaoTipo;
  id: string;
  nome: string;
  cor?: string; // Para equipes internas
  cidade?: string; // Para autorizados
  estado?: string; // Para autorizados
}
