export type CategoriaDeposito = 'travesseiro' | 'precaucoes';

export interface DepositoCaixa {
  id: string;
  data_deposito: string;
  valor: number;
  categoria: CategoriaDeposito;
  observacoes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DepositoCaixaFormData {
  data_deposito: string;
  valor: number;
  categoria: CategoriaDeposito;
  observacoes?: string;
}

export const CATEGORIAS_DEPOSITO = {
  travesseiro: { label: 'Travesseiro', color: 'hsl(var(--info))' },
  precaucoes: { label: 'Precauções', color: 'hsl(var(--warning))' }
} as const;
