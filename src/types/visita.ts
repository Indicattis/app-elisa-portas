export interface VisitaTecnica {
  id: string;
  lead_id: string;
  responsavel_id: string;
  data_visita: string;
  turno: 'manha' | 'tarde' | 'noite';
  status: 'agendada' | 'concluida' | 'cancelada';
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VisitaTecnicaWithLead extends VisitaTecnica {
  lead: {
    nome: string;
    telefone: string;
    cidade: string;
    endereco_rua: string;
    endereco_numero: string;
    endereco_bairro: string;
    endereco_cep: string;
  };
  responsavel_nome: string;
  created_by_nome: string;
}

export interface CreateVisitaData {
  lead_id: string;
  responsavel_id: string;
  data_visita: string;
  turno: 'manha' | 'tarde' | 'noite';
  observacoes?: string;
}

export const TURNO_LABELS = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite'
} as const;

export const STATUS_LABELS = {
  agendada: 'Agendada',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
} as const;