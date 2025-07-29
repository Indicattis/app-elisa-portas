export interface OrcamentoProduto {
  id?: string;
  orcamento_id?: string;
  tipo_produto: 'porta_enrolar' | 'porta_social' | 'acessorio' | 'manutencao' | 'adicional';
  medidas?: string;
  cor?: string;
  descricao: string;
  valor: number;
}

export interface ProdutoFormData {
  tipo_produto: string;
  medidas: string;
  cor: string;
  descricao: string;
  valor: string;
}