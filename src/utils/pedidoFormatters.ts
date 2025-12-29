/**
 * Formata o número do pedido mensal com o mês de vigência
 * Exemplo: "15 - Dez/2025"
 */
export function formatarNumeroPedidoMensal(
  numeroMes?: number | null, 
  mesVigencia?: string | null,
  numeroPedidoFallback?: string | null
): string {
  if (numeroMes && mesVigencia) {
    const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                             'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = new Date(mesVigencia);
    const mesAbrev = mesesAbreviados[data.getMonth()];
    const ano = data.getFullYear();
    return `${numeroMes} - ${mesAbrev}/${ano}`;
  }
  return numeroPedidoFallback || 'S/N';
}

/**
 * Formata apenas o mês de vigência
 * Exemplo: "Dez/2025"
 */
export function formatarMesVigencia(mesVigencia?: string | null): string {
  if (!mesVigencia) return '';
  
  const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                           'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const data = new Date(mesVigencia);
  const mesAbrev = mesesAbreviados[data.getMonth()];
  const ano = data.getFullYear();
  return `${mesAbrev}/${ano}`;
}
