
import type { OrcamentoProduto } from "./produto";

export interface OrcamentoFormData {
  lead_id: string;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  cliente_estado: string;
  cliente_cidade: string;
  cliente_bairro: string;
  cliente_cep: string;
  valor_frete: string;
  modalidade_instalacao: 'instalacao_elisa' | 'autorizado_elisa';
  autorizado_id?: string;
  forma_pagamento: string;
  desconto_total_percentual: number;
  requer_analise: boolean;
  motivo_analise: string;
  produtos?: OrcamentoProduto[];
}

export interface Acessorio {
  id: string;
  nome: string;
  preco: number;
  descricao?: string;
  ativo: boolean;
}

export interface Adicional {
  id: string;
  nome: string;
  preco: number;
  descricao?: string;
  ativo: boolean;
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
