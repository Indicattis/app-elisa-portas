/**
 * Helper centralizado para verificar se uma venda está faturada.
 * Critério: tem itens + frete_aprovado + todos itens com faturamento === true.
 * NÃO depende de custo_total > 0 (custo zero é válido).
 */
export const isVendaFaturada = (venda: any): boolean => {
  const portas = venda.portas || venda.produtos_vendas || [];
  if (portas.length === 0) return false;

  const freteAprovado = venda.frete_aprovado === true;
  const todosFaturados = portas.every((p: any) => p.faturamento === true);

  return freteAprovado && todosFaturados;
};
