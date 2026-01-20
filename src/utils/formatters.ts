/**
 * Formata um valor de tamanho para sempre exibir 2 casas decimais
 * Ex: "2.8" → "2.80m", "3,30" → "3.30m", "5" → "5.00m"
 */
export function formatarTamanho(tamanho: string | number | null | undefined): string {
  if (!tamanho) return '';
  
  // Remove sufixo 'm' se existir para processar
  const valorString = String(tamanho).replace(/m$/i, '').trim();
  const valor = parseFloat(valorString.replace(',', '.'));
  
  if (isNaN(valor)) return String(tamanho);
  
  return `${valor.toFixed(2)}m`;
}

/**
 * Formata dimensões (largura x altura) para sempre exibir 2 casas decimais
 * Ex: (2.8, 3) → "2.80m x 3.00m"
 */
export function formatarDimensoes(largura: number | null | undefined, altura: number | null | undefined): string {
  if (!largura || !altura) return '';
  return `${largura.toFixed(2)}m x ${altura.toFixed(2)}m`;
}
