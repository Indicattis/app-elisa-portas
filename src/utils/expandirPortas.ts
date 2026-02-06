/**
 * Utilitário para expandir portas por quantidade
 * Transforma 1 registro com quantidade=2 em 2 registros virtuais
 */

export interface PortaExpandida {
  // Campos originais do produto
  id: string;
  largura?: number;
  altura?: number;
  quantidade: number;
  tamanho?: string;
  tipo_produto?: string;
  peso_total?: number;
  quantidade_tiras?: number;
  cor?: { nome: string } | null;
  [key: string]: any;
  
  // Campos virtuais para identificação única
  _virtualKey: string;      // "produtoId_indice" - chave única para React
  _originalId: string;      // ID original do produto_venda
  _indicePorta: number;     // 0, 1, 2... índice dentro do grupo
  _totalNoGrupo: number;    // quantidade original do produto
}

export function expandirPortasPorQuantidade<T extends { id: string; quantidade?: number }>(
  produtos: T[]
): (T & { _virtualKey: string; _originalId: string; _indicePorta: number; _totalNoGrupo: number })[] {
  const expandidos: (T & { _virtualKey: string; _originalId: string; _indicePorta: number; _totalNoGrupo: number })[] = [];
  
  for (const produto of produtos) {
    const quantidade = produto.quantidade || 1;
    for (let i = 0; i < quantidade; i++) {
      expandidos.push({
        ...produto,
        _virtualKey: `${produto.id}_${i}`,
        _originalId: produto.id,
        _indicePorta: i,
        _totalNoGrupo: quantidade,
      });
    }
  }
  
  return expandidos;
}

/**
 * Obtém o rótulo para uma porta expandida
 * Ex: "Porta #1 (1/2)" se é a primeira de 2 portas iguais
 */
export function getLabelPortaExpandida(
  portaIndex: number,
  totalNoGrupo: number,
  indicePorta: number,
  tipoProduto?: string | null
): string {
  const TIPO_LABELS: Record<string, string> = {
    porta_enrolar: 'Porta de Enrolar',
    porta_social: 'Porta Social',
    acessorio: 'Acessório',
    adicional: 'Adicional',
    manutencao: 'Manutenção',
    pintura_epoxi: 'Pintura Epóxi',
  };
  const tipoLabel = tipoProduto ? (TIPO_LABELS[tipoProduto] || 'Item') : 'Porta';
  const label = `${tipoLabel} #${portaIndex + 1}`;
  if (totalNoGrupo > 1) {
    return `${label} (${indicePorta + 1}/${totalNoGrupo})`;
  }
  return label;
}
