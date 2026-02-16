export interface NeoInstalacao {
  id: string;
  nome_cliente: string;
  cidade: string;
  estado: string;
  data_instalacao: string | null;
  hora: string | null;
  descricao: string | null;
  equipe_id: string | null;
  equipe_nome: string | null;
  tipo_responsavel: 'equipe_interna' | 'autorizado' | null;
  autorizado_id: string | null;
  autorizado_nome: string | null;
  valor_total: number;
  valor_a_receber: number;
  status: string;
  concluida: boolean;
  concluida_em: string | null;
  concluida_por: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  vezes_agendado: number;
  // Campo para identificar tipo na listagem combinada
  _tipo?: 'neo_instalacao';
  // Dados da equipe (join)
  equipe?: {
    id: string;
    nome: string;
    cor: string | null;
  } | null;
  // Dados do autorizado (join)
  autorizado?: {
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
  } | null;
  // Dados do criador (join)
  criador?: {
    id: string;
    nome: string;
    foto_perfil_url: string | null;
  } | null;
}

export interface CriarNeoInstalacaoData {
  nome_cliente: string;
  cidade: string;
  estado: string;
  data_instalacao?: string | null;
  hora?: string | null;
  tipo_responsavel: 'equipe_interna' | 'autorizado';
  equipe_id?: string | null;
  equipe_nome?: string | null;
  autorizado_id?: string | null;
  autorizado_nome?: string | null;
  descricao?: string;
  valor_total?: number;
  valor_a_receber?: number;
}
