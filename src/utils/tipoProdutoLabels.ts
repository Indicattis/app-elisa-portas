/**
 * Helper para mapear tipo_produto para labels legíveis
 */

const TIPO_PRODUTO_LABELS: Record<string, string> = {
  porta_enrolar: 'Porta de Enrolar',
  porta_social: 'Porta Social',
  acessorio: 'Acessório',
  adicional: 'Adicional',
  manutencao: 'Manutenção',
  pintura_epoxi: 'Pintura Epóxi',
  instalacao: 'Instalação',
};

export function getLabelTipoProduto(tipoProduto?: string | null): string {
  if (!tipoProduto) return 'Item';
  return TIPO_PRODUTO_LABELS[tipoProduto] || 'Item';
}

/**
 * Gera label completa para um produto expandido, ex: "Porta de Enrolar #1 - 4,65m × 6,00m"
 */
export function getLabelProdutoExpandido(
  index: number,
  tipoProduto?: string | null,
  largura?: number | null,
  altura?: number | null,
  totalNoGrupo?: number,
  indicePorta?: number,
): string {
  const tipoLabel = getLabelTipoProduto(tipoProduto);
  let label = `${tipoLabel} #${index + 1}`;
  
  if (totalNoGrupo && totalNoGrupo > 1 && indicePorta !== undefined) {
    label = `${tipoLabel} #${index + 1} (${indicePorta + 1}/${totalNoGrupo})`;
  }
  
  if (largura && altura) {
    label += ` - ${largura.toFixed(2)}m × ${altura.toFixed(2)}m`;
  }
  
  return label;
}
