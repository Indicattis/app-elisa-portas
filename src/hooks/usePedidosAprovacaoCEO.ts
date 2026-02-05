import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePedidosEtapas } from "./usePedidosEtapas";

export interface PedidoAprovacao {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  valor_venda: number | null;
  data_entrega: string | null;
  created_at: string;
  produtos_resumo: string;
  pedidoCompleto: any; // Full pedido data for details sheet
}

export function usePedidosAprovacaoCEO() {
  const queryClient = useQueryClient();
  const { moverParaProximaEtapa } = usePedidosEtapas('aprovacao_ceo');

  // Buscar pedidos na etapa aprovacao_ceo
  const { data: pedidos = [], isLoading, refetch } = useQuery({
    queryKey: ['pedidos-aprovacao-ceo'],
    queryFn: async () => {
      // Buscar pedidos em aprovação CEO com dados completos para o sheet
      const { data: pedidosData, error } = await supabase
        .from('pedidos_producao')
        .select(`
          *,
          vendas:venda_id (
            *,
            produtos_vendas (*)
          )
        `)
        .eq('etapa_atual', 'aprovacao_ceo')
        .eq('arquivado', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!pedidosData) return [];

      return pedidosData.map((pedido: any) => {
        const venda = Array.isArray(pedido.vendas) ? pedido.vendas[0] : pedido.vendas;
        const produtos = venda?.produtos_vendas || [];
        
        // Construir resumo de produtos
        const contagem: Record<string, number> = {};
        produtos.forEach((p: any) => {
          const tipo = p.tipo_produto === 'porta_enrolar' ? 'Porta de Enrolar' : 
                       p.tipo_produto === 'motor' ? 'Motor' :
                       p.tipo_produto === 'acessorio' ? 'Acessório' : p.tipo_produto;
          contagem[tipo] = (contagem[tipo] || 0) + (p.quantidade || 1);
        });
        
        const resumo = Object.entries(contagem)
          .map(([tipo, qtd]) => `${qtd} ${tipo}${qtd > 1 ? 's' : ''}`)
          .join(', ') || 'Sem produtos';

        return {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
          cliente_nome: venda?.cliente_nome || 'Cliente não informado',
          valor_venda: venda?.valor_venda || null,
          data_entrega: pedido.data_entrega,
          created_at: pedido.created_at,
          produtos_resumo: resumo,
          pedidoCompleto: pedido // Full data for PedidoDetalhesSheet
        } as PedidoAprovacao;
      });
    },
    refetchInterval: 10000,
  });

  // Aprovar pedido e avançar para produção
  const aprovarPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      // Avançar diretamente para próxima etapa
      await moverParaProximaEtapa.mutateAsync({ pedidoId });
    },
    onSuccess: () => {
      toast.success('Pedido aprovado e enviado para produção!');
      queryClient.invalidateQueries({ queryKey: ['pedidos-aprovacao-ceo'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-etapas'] });
    },
    onError: (error) => {
      toast.error('Erro ao aprovar: ' + error.message);
    }
  });

  return {
    pedidos,
    isLoading,
    refetch,
    aprovarPedido
  };
}
