export interface NeoCorrecao {
  id: string;
  nome_cliente: string;
  cidade: string;
  estado: string;
  data_correcao: string | null;
  hora: string | null;
  descricao: string | null;
  equipe_id: string | null;
  equipe_nome: string | null;
  status: string;
  concluida: boolean;
  concluida_em: string | null;
  concluida_por: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Campo para identificar tipo na listagem combinada
  _tipo?: 'neo_correcao';
  // Dados da equipe (join)
  equipe?: {
    id: string;
    nome: string;
    cor: string | null;
  } | null;
}

export interface CriarNeoCorrecaoData {
  nome_cliente: string;
  cidade: string;
  estado: string;
  data_correcao: string;
  hora: string;
  equipe_id: string;
  equipe_nome: string;
  descricao?: string;
}
