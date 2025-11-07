import { ProdutoVenda } from '@/hooks/useVendas';

export function calcularCreditoTotal(produtos: ProdutoVenda[]): number {
  return produtos.reduce((total, produto) => {
    return total + ((produto.valor_credito || 0) * (produto.quantidade || 1));
  }, 0);
}

export function calcularPercentualCredito(
  creditoTotal: number,
  totalVenda: number
): number {
  if (totalVenda === 0) return 0;
  return (creditoTotal / totalVenda) * 100;
}

export function calcularTotalVendaSemCredito(produtos: ProdutoVenda[]): number {
  return produtos.reduce((total, produto) => {
    const valorBase = (produto.valor_produto + produto.valor_pintura + produto.valor_instalacao) * (produto.quantidade || 1);
    const desconto = produto.tipo_desconto === 'valor' 
      ? (produto.desconto_valor || 0)
      : valorBase * ((produto.desconto_percentual || 0) / 100);
    return total + valorBase - desconto;
  }, 0);
}

export function validarCredito(produtos: ProdutoVenda[]): {
  permitido: boolean;
  motivoBloqueio?: string;
  totalCredito: number;
  percentualCredito: number;
} {
  // Verificar se algum produto tem desconto
  const temDesconto = produtos.some(p => 
    (p.desconto_valor || 0) > 0 || (p.desconto_percentual || 0) > 0
  );
  
  if (temDesconto) {
    return {
      permitido: false,
      motivoBloqueio: 'Vendas com desconto não podem ter crédito adicional',
      totalCredito: 0,
      percentualCredito: 0
    };
  }
  
  const totalCredito = calcularCreditoTotal(produtos);
  const totalVendaSemCredito = calcularTotalVendaSemCredito(produtos);
  const percentualCredito = calcularPercentualCredito(totalCredito, totalVendaSemCredito);
  
  return {
    permitido: true,
    totalCredito,
    percentualCredito
  };
}
