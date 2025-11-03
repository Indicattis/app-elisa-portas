import type { EtapaPedido } from "@/types/pedidoEtapa";

export interface FluxogramaEtapa {
  id: EtapaPedido;
  label: string;
  color: string;
}

export const FLUXOGRAMA_ETAPAS: Record<EtapaPedido, FluxogramaEtapa> = {
  aberto: {
    id: 'aberto',
    label: 'Pedidos em Aberto',
    color: 'bg-gray-500'
  },
  em_producao: {
    id: 'em_producao',
    label: 'Em Produção',
    color: 'bg-blue-500'
  },
  inspecao_qualidade: {
    id: 'inspecao_qualidade',
    label: 'Inspeção de Qualidade',
    color: 'bg-purple-500'
  },
  aguardando_pintura: {
    id: 'aguardando_pintura',
    label: 'Aguardando Pintura',
    color: 'bg-pink-500'
  },
  aguardando_coleta: {
    id: 'aguardando_coleta',
    label: 'Aguardando Coleta',
    color: 'bg-yellow-500'
  },
  aguardando_instalacao: {
    id: 'aguardando_instalacao',
    label: 'Aguardando Instalação',
    color: 'bg-cyan-500'
  },
  finalizado: {
    id: 'finalizado',
    label: 'Finalizado',
    color: 'bg-green-500'
  }
};

/**
 * Determina o fluxograma de etapas que um pedido seguirá
 * baseado em suas características (pintura e tipo de entrega)
 */
export function determinarFluxograma(pedido: any): FluxogramaEtapa[] {
  // Extrair dados da venda
  const vendaData = Array.isArray(pedido.vendas) 
    ? pedido.vendas[0] 
    : pedido.vendas;
  
  const produtos = vendaData?.produtos_vendas || [];
  const temPintura = produtos.some((p: any) => p.valor_pintura > 0);
  const tipoEntrega = vendaData?.tipo_entrega;
  
  // Etapas base que todos os pedidos passam
  const baseFlow: FluxogramaEtapa[] = [
    FLUXOGRAMA_ETAPAS.aberto,
    FLUXOGRAMA_ETAPAS.em_producao,
    FLUXOGRAMA_ETAPAS.inspecao_qualidade
  ];
  
  // Se tem pintura, adiciona etapa de pintura
  if (temPintura) {
    baseFlow.push(FLUXOGRAMA_ETAPAS.aguardando_pintura);
  }
  
  // Define etapa final baseada no tipo de entrega
  if (tipoEntrega === 'entrega') {
    baseFlow.push(FLUXOGRAMA_ETAPAS.aguardando_coleta);
  } else if (tipoEntrega === 'instalacao') {
    baseFlow.push(FLUXOGRAMA_ETAPAS.aguardando_instalacao);
  }
  
  // Finalizado é sempre a última etapa
  baseFlow.push(FLUXOGRAMA_ETAPAS.finalizado);
  
  return baseFlow;
}

/**
 * Retorna o índice da etapa atual no fluxograma
 */
export function getIndiceEtapaAtual(
  fluxograma: FluxogramaEtapa[], 
  etapaAtual: EtapaPedido
): number {
  return fluxograma.findIndex(etapa => etapa.id === etapaAtual);
}
