export interface Instalacao {
  id: string;
  id_venda: string | null;
  nome_cliente: string;
  data?: string | null;
  hora: string;
  produto: string;
  estado: string;
  cidade: string;
  endereco?: string | null;
  cep?: string | null;
  descricao?: string | null;
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
  // Campos adicionais da tabela unificada
  venda_id?: string | null;
  telefone_cliente?: string | null;
  pedido_id?: string | null;
  responsavel_instalacao_id?: string | null;
  responsavel_instalacao_nome?: string | null;
  status?: string;
  tipo_instalacao?: 'elisa' | 'autorizados' | null;
  data_producao?: string | null;
  instalacao_concluida?: boolean;
  instalacao_concluida_em?: string | null;
  instalacao_concluida_por?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  last_geocoded_at?: string | null;
  geocode_precision?: string | null;
  justificativa_correcao?: string | null;
  alterado_para_correcao_em?: string | null;
  alterado_para_correcao_por?: string | null;
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
  data_venda: string;
}

export interface InstalacaoFormData {
  id_venda: string | null;
  nome_cliente: string;
  telefone_cliente?: string | null;
  data: string;
  hora: string;
  produto: string;
  estado: string;
  cidade: string;
  endereco?: string;
  cep?: string;
  descricao?: string;
  equipe_id: string;
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
