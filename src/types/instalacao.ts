export interface Instalacao {
  id: string;
  id_venda: string | null;
  nome_cliente: string;
  data: string;
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
