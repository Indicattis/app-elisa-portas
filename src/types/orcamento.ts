
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
  forma_pagamento: string;
  desconto_total_percentual: number;
  requer_analise: boolean;
  motivo_analise: string;
  canal_aquisicao_id?: string;
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

export interface OrcamentoStatus {
  1: "Em aberto";
  2: "Congelado"; 
  3: "Perdido";
  4: "Vendido";
  5: "Venda reprovada";
}

export interface OrcamentoClasse {
  1: { label: "Classe 1"; color: "muted"; range: "R$ 0 - 20.000" };
  2: { label: "Classe 2"; color: "success"; range: "R$ 20.001 - 50.000" };
  3: { label: "Classe 3"; color: "info"; range: "R$ 50.001 - 75.000" };
  4: { label: "Classe 4"; color: "premium"; range: "R$ 75.001 - 100.000" };
}

export type MotivoPerda = 'preco' | 'prazo' | 'qualidade' | 'logistica' | 'atendimento' | 'produto';

export interface CampoPersonalizado {
  nome: string;
  valor: string;
}
