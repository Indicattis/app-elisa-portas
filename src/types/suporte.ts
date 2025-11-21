export interface ChamadoSuporte {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  data_compra: string;
  descricao_problema: string;
  status: 'pendente' | 'cancelado' | 'resolvido';
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface ChamadosFilters {
  dataInicio?: string;
  dataFim?: string;
  nome?: string;
  telefone?: string;
  cpf?: string;
  status?: string;
}
