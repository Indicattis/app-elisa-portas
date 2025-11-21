export interface ContratoTemplate {
  id: string;
  nome: string;
  descricao?: string;
  conteudo: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ContratoVenda {
  id: string;
  venda_id: string;
  template_id?: string;
  arquivo_url: string;
  nome_arquivo: string;
  tamanho_arquivo: number;
  status: 'pendente_assinatura' | 'assinado' | 'cancelado';
  observacoes?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  template?: ContratoTemplate;
  venda?: {
    cliente_nome: string;
    cpf_cliente: string;
  };
}

export interface ContratoVariaveis {
  // Variáveis do cliente
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf?: string;
  cliente_endereco?: string;
  cliente_cidade?: string;
  cliente_estado?: string;
  cliente_bairro?: string;
  cliente_cep?: string;
  
  // Variáveis da venda
  venda_numero: string;
  venda_data: string;
  venda_valor_total: string;
  venda_valor_produtos: string;
  venda_valor_instalacao: string;
  venda_valor_frete: string;
  venda_forma_pagamento?: string;
  venda_numero_parcelas?: string;
  venda_valor_entrada: string;
  venda_previsao_entrega?: string;
  
  // Variáveis dos produtos
  produtos_lista: string;
  produtos_quantidade_total: string;
  
  // Variáveis do atendente
  atendente_nome: string;
  atendente_telefone?: string;
  
  // Variáveis da empresa
  empresa_nome: string;
  empresa_cnpj: string;
  empresa_endereco: string;
  empresa_cidade: string;
  empresa_cep: string;
  
  // Data de geração
  data_geracao: string;
}
