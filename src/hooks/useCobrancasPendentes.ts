import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CobrancaPendente {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  cidade: string | null;
  estado: string | null;
  venda_id: string;
  valor_venda: number;
  valorPendente: number;
  parcelasPendentes: number;
  proximoVencimento: string | null;
}

export function useCobrancasPendentes() {
  return useQuery({
    queryKey: ['cobrancas-pendentes'],
    queryFn: async (): Promise<CobrancaPendente[]> => {
      // 1. Buscar pedidos finalizados não arquivados
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos_producao')
        .select(`
          id, 
          numero_pedido, 
          cliente_nome, 
          cliente_telefone,
          endereco_cidade,
          endereco_estado,
          venda_id
        `)
        .eq('etapa_atual', 'finalizado')
        .eq('arquivado', false)
        .not('venda_id', 'is', null);
      
      if (pedidosError) throw pedidosError;
      if (!pedidos || pedidos.length === 0) return [];

      // 2. Buscar todas as vendas relacionadas
      const vendaIds = pedidos.map(p => p.venda_id).filter(Boolean) as string[];
      
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('id, valor_venda, cliente_nome, cliente_telefone, cidade, estado')
        .in('id', vendaIds);
      
      if (vendasError) throw vendasError;

      // 3. Buscar todas as contas a receber pendentes
      const { data: contasReceber, error: contasError } = await supabase
        .from('contas_receber')
        .select('id, venda_id, valor_parcela, data_vencimento, status')
        .in('venda_id', vendaIds)
        .eq('status', 'pendente');
      
      if (contasError) throw contasError;

      // 4. Montar o resultado combinando os dados
      const pedidosComCobranca: CobrancaPendente[] = pedidos
        .map(pedido => {
          const venda = vendas?.find(v => v.id === pedido.venda_id);
          const parcelas = contasReceber?.filter(c => c.venda_id === pedido.venda_id) || [];
          
          const valorPendente = parcelas.reduce((sum, p) => sum + (p.valor_parcela || 0), 0);
          const parcelasPendentes = parcelas.length;
          
          // Ordenar por data de vencimento e pegar a mais próxima
          const parcelasOrdenadas = [...parcelas].sort((a, b) => 
            new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
          );
          const proximoVencimento = parcelasOrdenadas[0]?.data_vencimento || null;

          return {
            id: pedido.id,
            numero_pedido: pedido.numero_pedido,
            cliente_nome: venda?.cliente_nome || pedido.cliente_nome,
            cliente_telefone: venda?.cliente_telefone || pedido.cliente_telefone,
            cidade: venda?.cidade || pedido.endereco_cidade,
            estado: venda?.estado || pedido.endereco_estado,
            venda_id: pedido.venda_id as string,
            valor_venda: venda?.valor_venda || 0,
            valorPendente,
            parcelasPendentes,
            proximoVencimento,
          };
        })
        .filter(p => p.valorPendente > 0);

      // 5. Ordenar por próximo vencimento
      return pedidosComCobranca.sort((a, b) => {
        if (!a.proximoVencimento) return 1;
        if (!b.proximoVencimento) return -1;
        return new Date(a.proximoVencimento).getTime() - new Date(b.proximoVencimento).getTime();
      });
    }
  });
}
