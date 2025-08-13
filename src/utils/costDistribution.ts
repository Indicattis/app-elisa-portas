import type { OrcamentoProduto } from '@/types/produto';

export interface ProdutoComCustoDistribuido extends OrcamentoProduto {
  valor_original: number;
  custo_frete_distribuido: number;
  custo_instalacao_distribuido: number;
}

/**
 * Distribui os custos de frete e instalação proporcionalmente entre produtos de porta
 * para exibição no PDF, mantendo o valor total correto
 */
export function distribuirCustosLogisticos(
  produtos: OrcamentoProduto[],
  valorFrete: number,
  valorInstalacao: number
): (ProdutoComCustoDistribuido | OrcamentoProduto)[] {
  // Identificar produtos de porta
  const produtosPorta = produtos.filter(
    produto => produto.tipo_produto === 'porta_enrolar' || produto.tipo_produto === 'porta_social'
  );
  
  // Se não há produtos de porta, retorna array original
  if (produtosPorta.length === 0) {
    return produtos;
  }
  
  // Calcular valor total das portas
  const valorTotalPortas = produtosPorta.reduce((total, produto) => total + produto.valor, 0);
  
  // Se valor total das portas é zero, retorna array original
  if (valorTotalPortas === 0) {
    return produtos;
  }
  
  // Distribuir custos proporcionalmente
  return produtos.map(produto => {
    if (produto.tipo_produto === 'porta_enrolar' || produto.tipo_produto === 'porta_social') {
      const proporcao = produto.valor / valorTotalPortas;
      const custoFreteDistribuido = valorFrete * proporcao;
      const custoInstalacaoDistribuido = valorInstalacao * proporcao;
      
      return {
        ...produto,
        valor_original: produto.valor,
        custo_frete_distribuido: custoFreteDistribuido,
        custo_instalacao_distribuido: custoInstalacaoDistribuido,
        valor: produto.valor + custoFreteDistribuido + custoInstalacaoDistribuido
      } as ProdutoComCustoDistribuido;
    }
    
    return produto;
  });
}

/**
 * Cria itens de linha para frete e instalação como "Incluso" no PDF
 */
export function criarItensLogisticosIncluso(): Array<{
  tipo_produto: string;
  descricao: string;
  valor: number;
  isLogisticItem: true;
}> {
  return [
    {
      tipo_produto: 'servico',
      descricao: 'Frete',
      valor: 0,
      isLogisticItem: true as const
    },
    {
      tipo_produto: 'servico', 
      descricao: 'Instalação',
      valor: 0,
      isLogisticItem: true as const
    }
  ];
}