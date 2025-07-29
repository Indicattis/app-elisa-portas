
import type { OrcamentoProduto } from "./produto";

export interface OrcamentoFormData {
  lead_id: string;
  valor_produto: string;
  valor_pintura: string;
  valor_frete: string;
  valor_instalacao: string;
  campos_personalizados: { [key: string]: number };
  forma_pagamento: string;
  desconto_percentual: number;
  requer_analise: boolean;
  motivo_analise: string;
  produtos?: OrcamentoProduto[];
}

export interface OrcamentoFilters {
  search: string;
  status: string;
  lead: string;
}

export interface CampoPersonalizado {
  nome: string;
  valor: string;
}
