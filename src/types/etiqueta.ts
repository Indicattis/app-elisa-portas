export interface EtiquetaCalculo {
  linhaId: string;
  nomeProduto: string;
  quantidade: number;
  etiquetasNecessarias: number;
  tipoCalculo: 'normal' | 'meia_cana_pequena' | 'meia_cana_grande' | 'regra_simples' | 'regra_condicional';
  explicacao: string;
  largura?: number;
  altura?: number;
  divisor?: number;  // Divisor usado na regra para distribuição de quantidade
}

export interface PedidoResumo {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  etapa_atual: string;
  created_at: string;
  status: string;
}

export interface LinhaResumo {
  id: string;
  pedido_id: string;
  nome_produto: string | null;
  descricao_produto: string | null;
  quantidade: number;
  largura: number | null;
  altura: number | null;
  tamanho: string | null;
  estoque_id?: string | null;
}

export interface TagIndividual {
  tagNumero: number;
  totalTags: number;
  nomeProduto: string;
  numeroPedido: string;
  quantidade: number;
  largura?: number;
  altura?: number;
}

export interface TagProducao extends TagIndividual {
  clienteNome?: string;
  tamanho?: string;
  corNome?: string;
  tipoPintura?: string;
  origemOrdem?: string;
  responsavelNome?: string;
  portaLabel?: string;  // Ex: "Porta #01 — 4,00m x 2,00m"
  // Campos para distribuição de quantidade
  quantidadeParcial?: number;  // Quantidade específica desta etiqueta
  quantidadeTotal?: number;    // Quantidade total da linha
  divisor?: number;            // Divisor usado na regra
}
