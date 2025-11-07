export interface EtiquetaCalculo {
  linhaId: string;
  nomeProduto: string;
  quantidade: number;
  etiquetasNecessarias: number;
  tipoCalculo: 'normal' | 'meia_cana_pequena' | 'meia_cana_grande';
  explicacao: string;
  largura?: number;
  altura?: number;
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
}
