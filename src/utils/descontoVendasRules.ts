import { ProdutoVenda } from '@/hooks/useVendas';

export interface DescontoLimits {
  limiteBase: number; // Limite padrão
  limitePresencial: number; // Adicional por venda presencial
  limiteTotal: number; // Limite sem senha
  limiteMaximo: number; // Limite absoluto (com senha)
}

export interface DescontoCalculation {
  totalVenda: number;
  descontoAplicado: number;
  percentualDesconto: number;
  limitePermitido: number;
  excedente: number; // Quanto % excede o limite
  dentroDoLimite: boolean;
  requerSenha: boolean;
  excedeLimiteMaximo: boolean;
}

/**
 * Calcula os limites de desconto baseado nas condições da venda
 */
export function calcularLimitesDesconto(
  formaPagamento: string,
  vendaPresencial: boolean
): DescontoLimits {
  const limiteBase = formaPagamento === 'a_vista' ? 5 : 0;
  const limitePresencial = vendaPresencial ? 5 : 0;
  const limiteTotal = limiteBase + limitePresencial;
  const limiteMaximo = 15;

  return {
    limiteBase,
    limitePresencial,
    limiteTotal,
    limiteMaximo
  };
}

/**
 * Calcula o total da venda sem descontos
 */
export function calcularTotalVenda(produtos: ProdutoVenda[]): number {
  return produtos.reduce((total, produto) => {
    const valorProduto = (
      produto.valor_produto + 
      produto.valor_pintura + 
      produto.valor_instalacao
    ) * produto.quantidade;
    return total + valorProduto;
  }, 0);
}

/**
 * Calcula o desconto total já aplicado nos produtos
 */
export function calcularDescontoTotal(produtos: ProdutoVenda[]): number {
  return produtos.reduce((total, produto) => {
    const valorBase = (
      produto.valor_produto + 
      produto.valor_pintura + 
      produto.valor_instalacao
    ) * produto.quantidade;
    
    const desconto = produto.tipo_desconto === 'valor'
      ? produto.desconto_valor
      : valorBase * (produto.desconto_percentual / 100);
    
    return total + desconto;
  }, 0);
}

/**
 * Calcula o percentual de desconto sobre o total da venda
 */
export function calcularPercentualDesconto(
  descontoTotal: number,
  totalVenda: number
): number {
  if (totalVenda === 0) return 0;
  return (descontoTotal / totalVenda) * 100;
}

/**
 * Valida se o desconto está dentro das regras
 */
export function validarDesconto(
  produtos: ProdutoVenda[],
  formaPagamento: string,
  vendaPresencial: boolean
): DescontoCalculation {
  const totalVenda = calcularTotalVenda(produtos);
  const descontoAplicado = calcularDescontoTotal(produtos);
  const percentualDesconto = calcularPercentualDesconto(descontoAplicado, totalVenda);
  const limites = calcularLimitesDesconto(formaPagamento, vendaPresencial);
  
  const excedente = percentualDesconto - limites.limiteTotal;
  const dentroDoLimite = excedente <= 0;
  const requerSenha = excedente > 0;
  const excedeLimiteMaximo = false; // Sem limite máximo

  return {
    totalVenda,
    descontoAplicado,
    percentualDesconto,
    limitePermitido: limites.limiteTotal,
    excedente: Math.max(0, excedente),
    dentroDoLimite,
    requerSenha,
    excedeLimiteMaximo
  };
}

/**
 * Formata o valor de desconto para exibição
 */
export function formatarDesconto(
  tipo: 'valor' | 'percentual',
  valor: number
): string {
  if (tipo === 'valor') {
    return `R$ ${valor.toFixed(2)}`;
  }
  return `${valor.toFixed(2)}%`;
}

/**
 * ID do usuário responsável pelo setor
 */
export const RESPONSAVEL_SETOR_ID = 'cff6be68-3bc3-4d62-98e4-8eb9101415c6';

/**
 * Determina o tipo de autorização necessária baseado no desconto
 */
export function getTipoAutorizacaoNecessaria(
  validacao: DescontoCalculation
): 'responsavel_setor' | 'master' | null {
  // Dentro do limite - não requer senha
  if (validacao.dentroDoLimite) {
    return null;
  }
  
  // Calcular quanto excedeu o limite permitido
  const excedente = validacao.excedente;
  
  // Excedeu até 5% - requer senha do responsável do setor
  if (excedente <= 5) {
    return 'responsavel_setor';
  }
  
  // Excedeu mais de 5% - requer senha master
  return 'master';
}
